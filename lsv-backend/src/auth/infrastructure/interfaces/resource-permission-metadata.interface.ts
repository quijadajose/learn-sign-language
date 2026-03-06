import { PermissionScope } from 'src/shared/domain/entities/moderatorPermission';

export interface ResourcePermissionSource {
  param?: string; // Nombre del parámetro en la ruta
  body?: string; // Path en el body (ej: 'languageId' o 'lessonId')
  query?: string; // Nombre del query parameter
  resolve?: string; // Path para resolver desde relación (ej: 'lesson.languageId', 'region.languageId')
}

export interface ResourcePermissionMetadata {
  scope: PermissionScope;
  source: ResourcePermissionSource;
  allowRegionModerators?: boolean; // Permite que moderadores de regiones dentro del lenguaje también tengan acceso (ej: para ver lecciones o quizzes)
}

export const RESOURCE_PERMISSION_KEY = 'resourcePermission';
