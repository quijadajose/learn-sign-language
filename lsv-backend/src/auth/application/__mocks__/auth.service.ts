export const AuthServiceMock = {
  registerUser: jest.fn().mockResolvedValue({
    user: { id: '123', email: 'test@example.com', username: 'testuser' },
    token: 'fake-jwt-token',
  }),
  login: jest.fn().mockResolvedValue({
    user: { id: '123', email: 'test@example.com', username: 'testuser' },
    token: 'fake-jwt-token',
  }),
  sendPasswordResetToken: jest.fn().mockResolvedValue(undefined),
  resetPassword: jest.fn().mockResolvedValue(undefined),
};
