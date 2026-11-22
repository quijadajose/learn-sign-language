import { assertFrontendUrlForEnv } from './env.validation.js';

describe('FRONTEND_URL en producción (AS-S5-03)', () => {
  it('rechaza http:// en producción', () => {
    expect(() =>
      assertFrontendUrlForEnv('production', 'http://lsv.example'),
    ).toThrow('FRONTEND_URL debe ser https:// en producción');
  });

  it('acepta https:// en producción', () => {
    expect(() =>
      assertFrontendUrlForEnv('production', 'https://lsv.example'),
    ).not.toThrow();
  });

  it('permite http:// fuera de producción', () => {
    expect(() =>
      assertFrontendUrlForEnv('development', 'http://localhost:8080'),
    ).not.toThrow();
  });
});
