import { SetMetadata } from '@nestjs/common';
import { PermissionScope } from 'src/shared/domain/entities/moderatorPermission';

export const PERMISSION_KEY = 'resource_permission';

export interface ResourcePermissionMetadata {
  scope: PermissionScope;
  idParam: string; // Name of the route param containing the resource ID
}

export const RequireResourcePermission = (
  scope: PermissionScope,
  idParam: string,
) => SetMetadata(PERMISSION_KEY, { scope, idParam });
