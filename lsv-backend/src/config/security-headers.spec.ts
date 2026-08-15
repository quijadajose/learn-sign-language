import { securityHeaders } from './security-headers';
import { Request, Response } from 'express';

describe('securityHeaders', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  function run(): Record<string, string> {
    const headers: Record<string, string> = {};
    const res = {
      setHeader(name: string, value: string) {
        headers[name] = value;
      },
    } as unknown as Response;
    const next = jest.fn();
    securityHeaders({} as Request, res, next);
    expect(next).toHaveBeenCalled();
    return headers;
  }

  it('sets nosniff, frame deny and related headers', () => {
    process.env.NODE_ENV = 'development';
    const headers = run();
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('no-referrer');
    expect(headers['Strict-Transport-Security']).toBeUndefined();
  });

  it('adds HSTS in production', () => {
    process.env.NODE_ENV = 'production';
    const headers = run();
    expect(headers['Strict-Transport-Security']).toBe(
      'max-age=31536000; includeSubDomains',
    );
  });
});
