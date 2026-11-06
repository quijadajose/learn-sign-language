import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionScope } from '../../../../shared/domain/entities/moderatorPermission.js';
import {
  ResourcePermissionMetadata,
  RESOURCE_PERMISSION_KEY,
} from '../../interfaces/resource-permission-metadata.interface.js';
import { ModeratorPermissionRepositoryInterface } from '../../../../moderator/domain/ports/moderator-permission.repository.interface.js';
import { ResourceIdResolver } from './resource-id-resolver.js';
import { Inject } from '@nestjs/common';

@Injectable()
export class ResourceAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject('ModeratorPermissionRepositoryInterface')
    private readonly moderatorPermissionRepository: ModeratorPermissionRepositoryInterface,
    private readonly resourceIdResolver: ResourceIdResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get<ResourcePermissionMetadata>(
      RESOURCE_PERMISSION_KEY,
      context.getHandler(),
    );

    // Si no hay decorador, permitir (otro guard puede manejar la autorización)
    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('errors.permission.unauthenticated');
    }

    // Si el usuario es admin global, permitir acceso
    if (user.role === 'admin') {
      return true;
    }

    const { scope, source } = metadata;
    const params = request.params || {};
    const body = request.body || {};
    const query = request.query || {};

    // Resolver el resourceId según la configuración
    const resourceId = await this.resourceIdResolver.resolveResourceId(
      source,
      params,
      body,
      query,
    );

    // BE-10: sin lenguaje resoluble no hay permiso por idioma: se deniega siempre.
    if (!resourceId) {
      throw new ForbiddenException('errors.permission.resourceIdNotFound');
    }

    // Verificar permisos según el scope
    if (scope === PermissionScope.LANGUAGE) {
      // Si se permite acceso a moderadores de región (para contenido como Lessons o Quizzes)
      const hasPermission = metadata.allowRegionModerators
        ? await this.moderatorPermissionRepository.checkUserPermissionForLanguage(
            user.sub || user.id,
            resourceId,
          )
        : !!(await this.moderatorPermissionRepository.findByUserIdAndLanguageId(
            user.sub || user.id,
            resourceId,
          ));

      if (!hasPermission) {
        throw new ForbiddenException(
          'You do not have permission to access this language resource',
        );
      }

      // BE-06: el body no puede mover el recurso a otro idioma sin permiso sobre ese idioma.
      if (
        typeof body.languageId === 'string' &&
        body.languageId !== resourceId
      ) {
        const targetAllowed = metadata.allowRegionModerators
          ? await this.moderatorPermissionRepository.checkUserPermissionForLanguage(
              user.sub || user.id,
              body.languageId,
            )
          : !!(await this.moderatorPermissionRepository.findByUserIdAndLanguageId(
              user.sub || user.id,
              body.languageId,
            ));
        if (!targetAllowed) {
          throw new ForbiddenException(
            'You do not have permission over the target language',
          );
        }
      }
      return true;
    }

    if (scope === PermissionScope.REGION) {
      // Verificar permiso directo sobre la región
      const hasDirectPermission =
        await this.moderatorPermissionRepository.findByUserIdAndRegionId(
          user.sub || user.id,
          resourceId,
        );

      if (hasDirectPermission) {
        // BE-06: no se puede mover a otra región sin permiso directo sobre ella.
        if (typeof body.regionId === 'string' && body.regionId !== resourceId) {
          const targetRegion =
            await this.moderatorPermissionRepository.findByUserIdAndRegionId(
              user.sub || user.id,
              body.regionId,
            );
          if (!targetRegion) {
            throw new ForbiddenException(
              'You do not have permission over the target region',
            );
          }
        }
        return true;
      }

      // Si no tiene permiso directo, verificar si tiene permiso sobre el lenguaje padre
      // Usamos el resolver para obtener el languageId desde la región
      try {
        const languageId = await this.resourceIdResolver.resolveFromRelation(
          'region.languageId',
          resourceId,
        );

        if (!languageId) {
          throw new ForbiddenException(
            'errors.permission.regionLanguageNotFound',
          );
        }

        const hasLanguagePermission =
          await this.moderatorPermissionRepository.findByUserIdAndLanguageId(
            user.sub || user.id,
            languageId,
          );

        if (!hasLanguagePermission) {
          throw new ForbiddenException(
            'You do not have permission to access this region resource',
          );
        }

        return true;
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error;
        }
        throw new ForbiddenException('errors.permission.verifyFailed');
      }
    }

    return false;
  }
}
