import { GoogleStrategy } from './google.strategy.js';

describe('GoogleStrategy account linking', () => {
  const config = {
    get: (key: string) =>
      ({
        GOOGLE_CLIENT_ID: 'client',
        GOOGLE_CLIENT_SECRET: 'secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/cb',
      })[key],
  };
  const profile = {
    id: 'google-sub-1',
    emails: [{ value: 'victim@example.com' }],
    name: { givenName: 'V', familyName: 'I' },
    _json: { email_verified: true },
  } as never;

  function build(existing: unknown) {
    const findUserUseCase = {
      findByEmail: jest.fn().mockResolvedValue(existing),
    };
    const registerUserUseCase = { registerUserWithOAuth2: jest.fn() };
    const authService = { generateToken: jest.fn().mockReturnValue('tok') };
    const strategy = new GoogleStrategy(
      config as never,
      findUserUseCase as never,
      registerUserUseCase as never,
      authService as never,
    );
    return { strategy, registerUserUseCase, authService };
  }

  it('refuses to link a password account that was not created by this Google id', async () => {
    const { strategy, authService } = build({
      id: 'local-1',
      email: 'victim@example.com',
      hashPassword: 'bcrypt-hash',
      googleId: null,
    });
    const done = jest.fn();
    await strategy.validate('at', 'rt', profile, done);
    expect(done).toHaveBeenCalledWith(null, false);
    expect(authService.generateToken).not.toHaveBeenCalled();
  });

  it('still signs in an account created by the same Google id', async () => {
    const { strategy } = build({
      id: 'g-1',
      email: 'victim@example.com',
      hashPassword: null,
      googleId: 'google-sub-1',
    });
    const done = jest.fn();
    await strategy.validate('at', 'rt', profile, done);
    expect(done).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ sub: 'g-1' }),
    );
  });
});
