import { resolveSupersedeScope } from './model-scope';

describe('resolveSupersedeScope', () => {
  it('prefers lessonVariantId over lessonId', () => {
    expect(
      resolveSupersedeScope({
        lessonId: 'lesson-1',
        lessonVariantId: 'variant-1',
      }),
    ).toEqual({ mode: 'variant', lessonVariantId: 'variant-1' });
  });

  it('scopes to lesson without variant when only lessonId', () => {
    expect(resolveSupersedeScope({ lessonId: 'lesson-1' })).toEqual({
      mode: 'lesson',
      lessonId: 'lesson-1',
    });
  });

  it('scopes custom models by exact name when no lesson/variant', () => {
    expect(
      resolveSupersedeScope({ name: 'Entrenamiento Base [Estático]' }),
    ).toEqual({
      mode: 'custom',
      name: 'Entrenamiento Base [Estático]',
    });
  });

  it('prefers lesson over custom name', () => {
    expect(
      resolveSupersedeScope({
        lessonId: 'lesson-1',
        name: 'Custom Name',
      }),
    ).toEqual({ mode: 'lesson', lessonId: 'lesson-1' });
  });

  it('returns none when both missing', () => {
    expect(resolveSupersedeScope({})).toEqual({ mode: 'none' });
    expect(
      resolveSupersedeScope({ lessonId: null, lessonVariantId: null }),
    ).toEqual({ mode: 'none' });
  });
});
