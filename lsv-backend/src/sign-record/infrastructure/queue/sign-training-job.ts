import { createHmac, timingSafeEqual } from 'crypto';

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === 'object') {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src).sort()) {
      if (key === 'jobHmac') {
        continue;
      }
      out[key] = canonicalize(src[key]);
    }
    return out;
  }
  return value;
}

export function canonicalJobJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function signTrainingJob(
  job: Record<string, unknown>,
  secret: string,
): string {
  return createHmac('sha256', secret)
    .update(canonicalJobJson(job))
    .digest('hex');
}

export function withJobHmac<T extends Record<string, unknown>>(
  job: T,
  secret: string,
): T & { jobHmac: string } {
  return { ...job, jobHmac: signTrainingJob(job, secret) };
}

export function verifyTrainingJobHmac(
  job: Record<string, unknown>,
  secret: string,
): boolean {
  const given = typeof job.jobHmac === 'string' ? job.jobHmac : '';
  const expected = signTrainingJob(job, secret);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(given, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
