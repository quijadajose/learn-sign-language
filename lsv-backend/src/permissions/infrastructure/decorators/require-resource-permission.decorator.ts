import { SetMetadata } from '@nestjs/common';
import { PermissionScope } from '../../../shared/domain/entities/moderatorPermission.js';
import {
  ResourcePermissionMetadata,
  ResourcePermissionSource,
  RESOURCE_PERMISSION_KEY,
} from '../interfaces/resource-permission-metadata.interface.js';

export const RequireResourcePermission = (
  scope: PermissionScope,
  source: ResourcePermissionSource,
  options: {
    allowRegionModerators?: boolean;
  } = {},
) =>
  SetMetadata<typeof RESOURCE_PERMISSION_KEY, ResourcePermissionMetadata>(
    RESOURCE_PERMISSION_KEY,
    { scope, source, ...options },
  );
