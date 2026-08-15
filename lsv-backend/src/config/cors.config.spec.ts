import { getCorsOrigins } from './cors.config';

describe('getCorsOrigins', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalFrontend = process.env.FRONTEND_URL;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalFrontend === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontend;
    }
  });

  it('does not append localhost origins in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://app.lsv.test';
    expect(getCorsOrigins()).toEqual(['https://app.lsv.test']);
  });

  it('includes local Vite/nginx origins outside production', () => {
    process.env.NODE_ENV = 'development';
    process.env.FRONTEND_URL = 'http://localhost:8080';
    const origins = getCorsOrigins();
    expect(origins).toEqual(
      expect.arrayContaining([
        'http://localhost:8080',
        'http://localhost:5173',
        'http://localhost',
      ]),
    );
  });
});
