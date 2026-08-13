import { Socket } from 'socket.io';
import { TokenService } from 'src/auth/domain/ports/token.service/token.service.interface';
import { SignRecordGateway } from './sign-record.gateway';

function mockSocket(handshake: {
  auth?: { token?: string };
  query?: Record<string, string>;
  headers?: Record<string, string>;
}): Socket & { disconnect: jest.Mock } {
  return {
    id: 'sock-1',
    handshake: {
      auth: handshake.auth ?? {},
      query: handshake.query ?? {},
      headers: handshake.headers ?? {},
    },
    data: {},
    disconnect: jest.fn(),
  } as unknown as Socket & { disconnect: jest.Mock };
}

describe('SignRecordGateway', () => {
  const tokenService = {
    verifyToken: jest.fn().mockReturnValue({ role: 'admin' }),
  };
  const gateway = new SignRecordGateway(
    tokenService as unknown as TokenService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.verifyToken.mockReturnValue({ role: 'admin' });
  });

  it('accepts handshake.auth.token', () => {
    const client = mockSocket({ auth: { token: 'jwt-from-auth' } });
    gateway.handleConnection(client);
    expect(tokenService.verifyToken).toHaveBeenCalledWith('jwt-from-auth');
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.data).toEqual({ user: { role: 'admin' } });
  });

  it('accepts Authorization Bearer header', () => {
    const client = mockSocket({
      headers: { authorization: 'Bearer jwt-from-header' },
    });
    gateway.handleConnection(client);
    expect(tokenService.verifyToken).toHaveBeenCalledWith('jwt-from-header');
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('rejects handshake.query.token', () => {
    const client = mockSocket({ query: { token: 'jwt-from-query' } });
    gateway.handleConnection(client);
    expect(tokenService.verifyToken).not.toHaveBeenCalled();
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });
});
