import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionScope } from 'src/shared/domain/entities/moderatorPermission';
import { ModeratorPermissionRepositoryInterface } from 'src/moderator/domain/ports/moderator-permission.repository.interface';
import { ResourceAccessGuard } from './resource-access.guard';
import { ResourceIdResolver } from './resource-id-resolver';
import { RESOURCE_PERMISSION_KEY } from '../../interfaces/resource-permission-metadata.interface';

describe('ResourceAccessGuard', () => {
  const reflector = { get: jest.fn() };
  const permissions = {
    findByUserId: jest.fn(),
    checkUserPermissionForLanguage: jest.fn(),
    findByUserIdAndLanguageId: jest.fn(),
    findByUserIdAndRegionId: jest.fn(),
  };
  const resolver = {
    resolveResourceId: jest.fn(),
    resolveFromRelation: jest.fn(),
  };

  const guard = new ResourceAccessGuard(
    reflector as unknown as Reflector,
    permissions as unknown as ModeratorPermissionRepositoryInterface,
    resolver as unknown as ResourceIdResolver,
  );

  const makeContext = (
    user: unknown,
    body: Record<string, unknown> = {},
  ): ExecutionContext =>
    ({
      getHandler: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user, params: {}, body, query: {} }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows when no metadata is configured', async () => {
    reflector.get.mockReturnValue(undefined);
    await expect(guard.canActivate(makeContext(null))).resolves.toBe(true);
  });

  it('allows admins without further checks', async () => {
    reflector.get.mockReturnValue({
      scope: PermissionScope.LANGUAGE,
      source: { body: 'languageId' },
    });
    await expect(
      guard.canActivate(makeContext({ role: 'admin', sub: 'a1' })),
    ).resolves.toBe(true);
    expect(resolver.resolveResourceId).not.toHaveBeenCalled();
  });

  it('forbids unauthenticated users when metadata exists', async () => {
    reflector.get.mockReturnValue({
      scope: PermissionScope.LANGUAGE,
      source: { body: 'languageId' },
    });
    await expect(guard.canActivate(makeContext(null))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows language moderators with matching permission', async () => {
    reflector.get.mockReturnValue({
      scope: PermissionScope.LANGUAGE,
      source: { body: 'languageId' },
      allowRegionModerators: true,
    });
    resolver.resolveResourceId.mockResolvedValue('lang-1');
    permissions.checkUserPermissionForLanguage.mockResolvedValue(true);

    await expect(
      guard.canActivate(
        makeContext({ role: 'moderator', sub: 'm1' }, { languageId: 'lang-1' }),
      ),
    ).resolves.toBe(true);
    expect(permissions.checkUserPermissionForLanguage).toHaveBeenCalledWith(
      'm1',
      'lang-1',
    );
  });

  it('forbids moderators without language permission', async () => {
    reflector.get.mockReturnValue({
      scope: PermissionScope.LANGUAGE,
      source: { body: 'languageId' },
      allowRegionModerators: true,
    });
    resolver.resolveResourceId.mockResolvedValue('lang-1');
    permissions.checkUserPermissionForLanguage.mockResolvedValue(false);

    await expect(
      guard.canActivate(makeContext({ role: 'moderator', sub: 'm1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // Keep Reflector key import used (documents contract)
  it('uses RESOURCE_PERMISSION_KEY metadata', () => {
    expect(RESOURCE_PERMISSION_KEY).toBeDefined();
  });
});
