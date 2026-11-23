import { SignRecordEvents } from './sign-record.events.js';

describe('SignRecordEvents model binding', () => {
  // En producción el jobId de cada entrenamiento ES el modelId (trigger-training).
  const JOB_MODEL = '11111111-1111-4111-8111-111111111111';
  const JOB_ID = JOB_MODEL;
  const OTHER_MODEL = '22222222-2222-4222-8222-222222222222';

  function build() {
    const signRecordService = {
      saveModelResults: jest.fn().mockResolvedValue(undefined),
      updateModelStatus: jest.fn().mockResolvedValue(undefined),
      reportProgress: jest.fn().mockResolvedValue(undefined),
    };
    const trainingQueue = {
      getJob: jest
        .fn()
        .mockResolvedValue({ id: JOB_ID, data: { modelId: JOB_MODEL } }),
    };
    const events = new SignRecordEvents(
      signRecordService as never,
      trainingQueue as never,
    );
    (events as unknown as { logger: unknown }).logger = {
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
    };
    return { events, signRecordService };
  }

  it('rejects a completed result that names another model', async () => {
    const { events, signRecordService } = build();
    await events.onCompleted({
      jobId: JOB_ID,
      returnvalue: JSON.stringify({ modelId: OTHER_MODEL }),
    } as never);
    expect(signRecordService.saveModelResults).not.toHaveBeenCalled();
  });

  it('saves a completed result that matches the job model', async () => {
    const { events, signRecordService } = build();
    await events.onCompleted({
      jobId: JOB_ID,
      returnvalue: JSON.stringify({ modelId: JOB_MODEL }),
    } as never);
    expect(signRecordService.saveModelResults).toHaveBeenCalledWith(
      JOB_MODEL,
      expect.anything(),
    );
  });

  it('ignores progress that names another model', async () => {
    const { events, signRecordService } = build();
    await events.onProgress?.({
      jobId: JOB_ID,
      data: JSON.stringify({ modelId: OTHER_MODEL, progress: 50 }),
    } as never);
    expect(signRecordService.reportProgress).not.toHaveBeenCalledWith(
      OTHER_MODEL,
      expect.anything(),
    );
  });
});
