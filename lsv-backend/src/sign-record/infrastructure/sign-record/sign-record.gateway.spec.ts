import { Socket } from 'socket.io';
import { TokenService } from '../../../auth/domain/ports/token.service/token.service.interface.js';
import { UserRepositoryInterface } from '../../../auth/domain/ports/user.repository.interface/user.repository.interface.js';
import { SignRecordGateway } from './sign-record.gateway.js';

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
  const payload = { sub: 'user-1', role: 'admin', tokenVersion: 3 };
  const tokenService = {
    verifyToken: jest.fn().mockReturnValue(payload),
  };
  const userRepository = {
    findAuthStateById: jest.fn().mockResolvedValue({
      id: 'user-1',
      role: 'admin',
      tokenVersion: 3,
    }),
  };
  const gateway = new SignRecordGateway(
    tokenService as unknown as TokenService,
    userRepository as unknown as UserRepositoryInterface,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.verifyToken.mockReturnValue(payload);
    userRepository.findAuthStateById.mockResolvedValue({
      id: 'user-1',
      role: 'admin',
      tokenVersion: 3,
    });
  });

  it('accepts handshake.auth.token', async () => {
    const client = mockSocket({ auth: { token: 'jwt-from-auth' } });
    await gateway.handleConnection(client);
    expect(tokenService.verifyToken).toHaveBeenCalledWith('jwt-from-auth');
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.data).toEqual({ user: payload });
  });

  it('accepts Authorization Bearer header', async () => {
    const client = mockSocket({
      headers: { authorization: 'Bearer jwt-from-header' },
    });
    await gateway.handleConnection(client);
    expect(tokenService.verifyToken).toHaveBeenCalledWith('jwt-from-header');
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('accepts the lsv_access cookie', async () => {
    const client = mockSocket({
      headers: { cookie: 'lsv_access=jwt-from-cookie' },
    });
    await gateway.handleConnection(client);
    expect(tokenService.verifyToken).toHaveBeenCalledWith('jwt-from-cookie');
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('rejects handshake.query.token', async () => {
    const client = mockSocket({ query: { token: 'jwt-from-query' } });
    await gateway.handleConnection(client);
    expect(tokenService.verifyToken).not.toHaveBeenCalled();
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('rejects sockets whose token version was revoked (BE-16)', async () => {
    userRepository.findAuthStateById.mockResolvedValue({
      id: 'user-1',
      role: 'user',
      tokenVersion: 4,
    });
    const client = mockSocket({ auth: { token: 'jwt-revoked' } });
    await gateway.handleConnection(client);
    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(client.data).toEqual({});
  });

  it('uses the role stored in the database, not the one in the token (BE-16)', async () => {
    userRepository.findAuthStateById.mockResolvedValue({
      id: 'user-1',
      role: 'moderator',
      tokenVersion: 3,
    });
    const client = mockSocket({ auth: { token: 'jwt-demoted' } });
    await gateway.handleConnection(client);
    expect(client.data).toEqual({ user: { ...payload, role: 'moderator' } });
  });
});
