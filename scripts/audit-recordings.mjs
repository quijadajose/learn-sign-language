#!/usr/bin/env node
/**
 * Backfills `isValidated` and `handConfidence` on historical sign_recording rows
 * using the same hand-presence rules as landmark-validation.ts.
 *
 * Usage (from repo root):
 *   node scripts/audit-recordings.mjs
 *   node scripts/audit-recordings.mjs --dry-run
 *   docker exec lsv-lsv-api-1 node scripts/audit-recordings.mjs
 *
 * Env: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
 */

import pg from "../lsv-backend/node_modules/pg/lib/index.js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FEATURES_COUNT = 258;
const HAND_FEATURE_START = 33 * 4;
const HAND_VALIDATION_THRESHOLD = 0.8;

function loadEnvFile() {
  const envPath = resolve(__dirname, "../.env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

const dryRun = process.argv.includes("--dry-run");

function frameFlat(frame) {
  if (!frame) return null;
  if (Array.isArray(frame)) return frame;
  if (typeof frame === "object" && frame !== null && "flat" in frame) {
    return Array.isArray(frame.flat) ? frame.flat : null;
  }
  return null;
}

function frameHasHandData(frame) {
  const flat = frameFlat(frame);
  if (!flat || flat.length !== FEATURES_COUNT) return false;
  for (let i = HAND_FEATURE_START; i < flat.length; i++) {
    if (Math.abs(flat[i]) > 0.001) return true;
  }
  return false;
}

function computeHandConfidence(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length === 0) return 0;
  const withHands = landmarks.filter(frameHasHandData).length;
  return withHands / landmarks.length;
}

async function main() {
  const client = new pg.Client({
    host:
      process.env.DB_HOST === "lsv-db"
        ? "localhost"
        : process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || "user",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_DATABASE || "plataforma",
  });

  await client.connect();
  console.log(
    dryRun
      ? "DRY RUN — no writes"
      : "Auditing sign_recording validation fields...",
  );

  try {
    const { rows } = await client.query(
      `SELECT id, landmarks, "isValidated", "handConfidence"
       FROM sign_recording
       WHERE landmarks IS NOT NULL`,
    );

    let updated = 0;
    let validated = 0;
    let unchanged = 0;

    if (!dryRun) await client.query("BEGIN");

    for (const row of rows) {
      const handConfidence = computeHandConfidence(row.landmarks);
      const isValidated = handConfidence >= HAND_VALIDATION_THRESHOLD;
      const prevConfidence =
        row.handConfidence == null ? null : Number(row.handConfidence);
      const same =
        Boolean(row.isValidated) === isValidated &&
        prevConfidence !== null &&
        Math.abs(prevConfidence - handConfidence) < 1e-9;

      if (same) {
        unchanged += 1;
        continue;
      }

      updated += 1;
      if (isValidated) validated += 1;

      if (!dryRun) {
        await client.query(
          `UPDATE sign_recording
           SET "isValidated" = $1, "handConfidence" = $2
           WHERE id = $3`,
          [isValidated, handConfidence, row.id],
        );
      }
    }

    if (!dryRun) await client.query("COMMIT");

    console.log("\nResults:");
    console.log(`  total scanned: ${rows.length}`);
    console.log(`  would update / updated: ${updated}`);
    console.log(`  newly validated (≥ ${HAND_VALIDATION_THRESHOLD}): ${validated}`);
    console.log(`  unchanged: ${unchanged}`);
    console.log(dryRun ? "\nDone (dry run)." : "\nDone.");
  } catch (err) {
    if (!dryRun) await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
