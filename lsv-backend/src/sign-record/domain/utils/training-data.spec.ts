import {
  mergeValidatedWithLandmarkFallback,
  recordingsToTrainingSamples,
  serializeRecordingLandmarks,
  splitRecordingsForDualTraining,
} from './training-data';
import { Sign } from 'src/shared/domain/entities/sign';
import { SignRecording } from 'src/shared/domain/entities/signRecording';

describe('training-data', () => {
  it('serializes flat and nested landmark frames', () => {
    expect(serializeRecordingLandmarks([[1, 2], { flat: [3, 4] }])).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('splits static/dynamic and collects global static noise', () => {
    const staticGlobal = {
      sign: { name: 'A', detectionType: 'static', isGlobal: true },
      landmarks: [[1]],
    } as SignRecording;
    const staticLesson = {
      sign: { name: 'B', detectionType: 'static', isGlobal: false },
      landmarks: [[2]],
    } as SignRecording;
    const dynamic = {
      sign: { name: 'C', detectionType: 'dynamic', isGlobal: false },
      landmarks: [[3]],
    } as SignRecording;

    const result = splitRecordingsForDualTraining([
      staticGlobal,
      staticLesson,
      dynamic,
    ]);

    expect(result.staticRecordings).toHaveLength(2);
    expect(result.dynamicRecordings).toHaveLength(1);
    expect(result.globalStaticForDynamic).toEqual([staticGlobal]);
  });

  it('maps recordings to training samples', () => {
    const samples = recordingsToTrainingSamples([
      {
        sign: { name: 'Hola', detectionType: 'dynamic', isGlobal: false },
        landmarks: [{ flat: [1, 2] }],
      } as SignRecording,
    ]);
    expect(samples[0]).toMatchObject({
      signName: 'Hola',
      detectionType: 'dynamic',
      isGlobal: false,
      landmarks: [[1, 2]],
    });
  });

  it('merges validated recordings with landmark fallback for uncovered signs', () => {
    const covered: SignRecording = {
      sign: { id: 's1', name: 'One' } as Sign,
      landmarks: [[1]],
    } as SignRecording;

    const signs = [
      { id: 's1', name: 'One', landmarks: [[9]] } as Sign,
      {
        id: 's2',
        name: 'Two',
        landmarks: [[2]],
        variants: [{ region: { id: 'r1' }, landmarks: [[22]] }],
      } as unknown as Sign,
      { id: 's3', name: 'Empty', landmarks: [] } as Sign,
    ];

    const merged = mergeValidatedWithLandmarkFallback([covered], signs, 'r1');
    expect(merged).toHaveLength(2);
    expect(merged[0].sign.id).toBe('s1');
    expect(merged[1].landmarks).toEqual([[22]]);
  });
});
