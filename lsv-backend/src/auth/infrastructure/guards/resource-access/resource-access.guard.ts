import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionScope } from 'src/shared/domain/entities/moderatorPermission';
import {
  ResourcePermissionMetadata,
  RESOURCE_PERMISSION_KEY,
} from '../../interfaces/resource-permission-metadata.interface';
import { ModeratorPermissionRepositoryInterface } from 'src/moderator/domain/ports/moderator-permission.repository.interface';
import { ResourceIdResolver } from './resource-id-resolver';
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
      throw new ForbiddenException('User not authenticated');
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

    if (!resourceId) {
      throw new ForbiddenException('Resource ID not found');
    }

    // Verificar permisos según el scope
    if (scope === PermissionScope.LANGUAGE) {
      let hasPermission = false;

      // Si se permite acceso a moderadores de región (para contenido como Lessons o Quizzes)
      if (metadata.allowRegionModerators) {
        hasPermission =
          await this.moderatorPermissionRepository.checkUserPermissionForLanguage(
            user.sub || user.id,
            resourceId,
          );
      } else {
        // Solo moderador directo del lenguaje
        const directPermission =
          await this.moderatorPermissionRepository.findByUserIdAndLanguageId(
            user.sub || user.id,
            resourceId,
          );
        hasPermission = !!directPermission;
      }

      if (!hasPermission) {
        throw new ForbiddenException(
          'You do not have permission to access this language resource',
        );
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
          throw new ForbiddenException('Region language not found');
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
        throw new ForbiddenException('Error verifying region permissions');
      }
    }

    return false;
  }
}
