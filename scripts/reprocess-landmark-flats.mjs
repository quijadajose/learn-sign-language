#!/usr/bin/env node
/**
 * Re-calculates `flat` vectors in stored landmarks using the current
 * normalization (chest-relative pose + wrist/scaled hands).
 *
 * Usage (from repo root, via lsv-api container):
 *   docker exec lsv-lsv-api-1 node scripts/reprocess-landmark-flats.mjs
 *   docker exec lsv-lsv-api-1 node scripts/reprocess-landmark-flats.mjs --dry-run
 *
 * Env: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
 * Defaults match .env with DB_HOST=localhost for host execution.
 */

import pg from "../lsv-backend/node_modules/pg/lib/index.js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FEATURES_COUNT = 258;

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

function normalizeHandLocal(handRaw) {
  if (!handRaw || handRaw.length === 0) return Array(21 * 3).fill(0);

  const wrist = handRaw[0];
  const middleMcp = handRaw[9];

  const scale =
    Math.sqrt(
      (middleMcp.x - wrist.x) ** 2 +
        (middleMcp.y - wrist.y) ** 2 +
        (middleMcp.z - wrist.z) ** 2,
    ) || 1;

  return handRaw
    .map((kp) => [
      (kp.x - wrist.x) / scale,
      (kp.y - wrist.y) / scale,
      (kp.z - wrist.z) / scale,
    ])
    .flat();
}

function landmarksToFlatVector(poseRaw, leftHandRaw, rightHandRaw) {
  let chestX = 0;
  let chestY = 0;
  let chestZ = 0;

  if (poseRaw && poseRaw.length >= 13) {
    chestX = (poseRaw[11].x + poseRaw[12].x) / 2;
    chestY = (poseRaw[11].y + poseRaw[12].y) / 2;
    chestZ = (poseRaw[11].z + poseRaw[12].z) / 2;
  }

  const pose = (poseRaw || Array(33).fill({ x: 0, y: 0, z: 0 }))
    .map((p) => [
      p.x - chestX,
      p.y - chestY,
      p.z - chestZ,
      p.visibility ?? 0,
    ])
    .flat();

  const lh = normalizeHandLocal(leftHandRaw);
  const rh = normalizeHandLocal(rightHandRaw);

  return [...pose, ...lh, ...rh];
}

function reprocessFrames(frames) {
  if (!Array.isArray(frames)) return { frames, changed: 0, skipped: 1 };

  let changed = 0;
  let skipped = 0;

  const updated = frames.map((frame) => {
    if (!frame || typeof frame !== "object" || Array.isArray(frame)) {
      skipped += 1;
      return frame;
    }

    if (!("pose" in frame) && frame.leftHand === undefined && frame.rightHand === undefined) {
      skipped += 1;
      return frame;
    }

    const poseRaw = frame.pose ?? null;
    const leftHandRaw = frame.leftHand ?? null;
    const rightHandRaw = frame.rightHand ?? null;
    const flat = landmarksToFlatVector(poseRaw, leftHandRaw, rightHandRaw);

    if (flat.length !== FEATURES_COUNT) {
      skipped += 1;
      return frame;
    }

    const prev = frame.flat;
    const same =
      Array.isArray(prev) &&
      prev.length === flat.length &&
      prev.every((v, i) => Math.abs(v - flat[i]) < 1e-9);

    if (!same) changed += 1;

    return { ...frame, flat };
  });

  return { frames: updated, changed, skipped };
}

async function updateTable(client, table, idColumn, landmarksColumn) {
  const { rows } = await client.query(
    `SELECT "${idColumn}" AS id, "${landmarksColumn}" AS landmarks
     FROM "${table}"
     WHERE "${landmarksColumn}" IS NOT NULL`,
  );

  let updatedRows = 0;
  let changedFrames = 0;

  for (const row of rows) {
    const { frames, changed, skipped } = reprocessFrames(row.landmarks);
    if (changed === 0) continue;

    updatedRows += 1;
    changedFrames += changed;

    if (!dryRun) {
      await client.query(
        `UPDATE "${table}" SET "${landmarksColumn}" = $1::jsonb WHERE "${idColumn}" = $2`,
        [JSON.stringify(frames), row.id],
      );
    }
  }

  return { total: rows.length, updatedRows, changedFrames, skipped: 0 };
}

async function main() {
  const client = new pg.Client({
    host: process.env.DB_HOST === "lsv-db" ? "localhost" : process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || "user",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_DATABASE || "plataforma",
  });

  await client.connect();
  console.log(dryRun ? "DRY RUN — no writes" : "Reprocessing landmark flat vectors...");

  try {
    if (!dryRun) await client.query("BEGIN");

    const recordingStats = await updateTable(client, "sign_recording", "id", "landmarks");
    const signStats = await updateTable(client, "sign", "id", "landmarks");
    const variantStats = await updateTable(client, "sign_variant", "id", "landmarks");

    if (!dryRun) await client.query("COMMIT");

    console.log("\nResults:");
    console.log(`  sign_recording: ${recordingStats.updatedRows}/${recordingStats.total} rows updated`);
    console.log(`  sign:           ${signStats.updatedRows}/${signStats.total} rows updated`);
    console.log(`  sign_variant:   ${variantStats.updatedRows}/${variantStats.total} rows updated`);

    // Sample verification
    const sample = await client.query(
      `SELECT sr.id, s.name,
              sr.landmarks->0->'flat' AS new_flat
       FROM sign_recording sr
       JOIN sign s ON s.id = sr."signId"
       WHERE sr.landmarks->0->'rightHand' IS NOT NULL
          OR sr.landmarks->0->'leftHand' IS NOT NULL
       LIMIT 1`,
    );
    if (sample.rows[0]) {
      const flat = sample.rows[0].new_flat;
      console.log(`\nSample (${sample.rows[0].name}): flat length = ${flat?.length ?? 0}`);
      if (flat?.length === FEATURES_COUNT) {
        console.log("  hand slice (first 9 values):", flat.slice(132, 141).map((n) => n.toFixed(4)));
      }
    }

    console.log(dryRun ? "\nDone (dry run)." : "\nDone. Re-train models from Sign Studio.");
  } catch (err) {
    if (!dryRun) await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
