import { Socket } from 'socket.io';
import { TokenService } from '../../../auth/domain/ports/token.service/token.service.interface.js';
import { UserRepositoryInterface } from '../../../auth/domain/ports/user.repository.interface/user.repository.interface.js';
import { SignRecordGateway } from './sign-record.gateway.js';
import { ModeratorPermissionRepositoryInterface } from '../../../moderator/domain/ports/moderator-permission.repository.interface.js';

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
    join: jest.fn(),
  } as unknown as Socket & { disconnect: jest.Mock; join: jest.Mock };
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
  const moderatorPermissionRepository = {
    findAccessibleLanguageIds: jest.fn().mockResolvedValue(['lang-1']),
  };
  const gateway = new SignRecordGateway(
    tokenService as unknown as TokenService,
    userRepository as unknown as UserRepositoryInterface,
    moderatorPermissionRepository as unknown as ModeratorPermissionRepositoryInterface,
  );
  const server = { to: jest.fn(), emit: jest.fn() };
  gateway.server = server as unknown as typeof gateway.server;

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

  describe('training notifications scoping (BE-16)', () => {
    beforeEach(() => {
      server.to.mockReturnValue(server);
    });

    it('lets admins subscribe to the global admin room only', async () => {
      const client = mockSocket({});
      (client as unknown as { data: unknown }).data = {
        user: { sub: 'user-1', role: 'admin' },
      };
      const result = await gateway.handleSubscribeAdmin(client);
      expect(result).toEqual({ status: 'subscribed' });
      expect(client.join).toHaveBeenCalledWith('admin-training-updates');
    });

    it('lets moderators join only the rooms of their languages', async () => {
      const client = mockSocket({});
      (client as unknown as { data: unknown }).data = {
        user: { sub: 'mod-1', role: 'moderator' },
      };
      await gateway.handleSubscribeAdmin(client);
      expect(
        moderatorPermissionRepository.findAccessibleLanguageIds,
      ).toHaveBeenCalledWith('mod-1');
      expect(client.join).toHaveBeenCalledWith('admin-training-lang:lang-1');
      expect(client.join).not.toHaveBeenCalledWith('admin-training-updates');
    });

    it('rejects other roles', async () => {
      const client = mockSocket({});
      (client as unknown as { data: unknown }).data = {
        user: { sub: 'user-2', role: 'user' },
      };
      const result = await gateway.handleSubscribeAdmin(client);
      expect(result).toEqual({ status: 'forbidden' });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('sends progress to admins and to the model language room', () => {
      gateway.sendProgress('model-1', 'lang-1', 0.5, 0.9);
      expect(server.to).toHaveBeenCalledWith('admin-training-updates');
      expect(server.to).toHaveBeenCalledWith('admin-training-lang:lang-1');
    });

    it('sends only to admins when the model has no language', () => {
      gateway.emitStatusChange('model-1', null, 'READY');
      expect(server.to).toHaveBeenCalledTimes(1);
      expect(server.to).toHaveBeenCalledWith('admin-training-updates');
    });
  });
});
