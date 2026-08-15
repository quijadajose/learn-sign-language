import {
  canonicalJobJson,
  signTrainingJob,
  verifyTrainingJobHmac,
} from './sign-training-job';

describe('sign-training-job', () => {
  const secret = 'test-hmac-secret';

  it('signs and verifies a stable payload', () => {
    const job = {
      modelId: 'm1',
      modelType: 'static',
      dataPath: '/shared/training_data/a.json',
      outputPath: '/shared/models/m1',
    };
    const hmac = signTrainingJob(job, secret);
    expect(hmac).toHaveLength(64);
    expect(verifyTrainingJobHmac({ ...job, jobHmac: hmac }, secret)).toBe(true);
  });

  it('is independent of key insertion order', () => {
    const a = signTrainingJob({ b: 1, a: 2, dataPath: '/x' }, secret);
    const b = signTrainingJob({ dataPath: '/x', a: 2, b: 1 }, secret);
    expect(a).toBe(b);
  });

  it('rejects a tampered path', () => {
    const job = { modelId: 'm1', dataPath: '/shared/a.json' };
    const hmac = signTrainingJob(job, secret);
    expect(
      verifyTrainingJobHmac(
        { ...job, dataPath: '/etc/passwd', jobHmac: hmac },
        secret,
      ),
    ).toBe(false);
  });

  it('canonical JSON omits jobHmac', () => {
    expect(canonicalJobJson({ a: 1, jobHmac: 'deadbeef' })).toBe(
      canonicalJobJson({ a: 1 }),
    );
  });

  it('matches the Python HMAC fixture', () => {
    expect(
      signTrainingJob(
        {
          modelId: 'm1',
          modelType: 'static',
          dataPath: '/shared/training_data/a.json',
          outputPath: '/shared/models/m1',
        },
        secret,
      ),
    ).toBe('07d6e78b4e8e9b74fbb11e8f8652073611bdb381c1bc8f3a680df645812c8133');
  });
});
