import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { isUUID } from 'class-validator';

export type UploadActor = { id: string; role: string };

export type UploadPolicyPorts = {
  hasLanguagePermission(userId: string, languageId: string): Promise<boolean>;
};

/** Carpetas cuyas imágenes reciben un id generado por el servidor (no se pueden sobrescribir). */
export const SERVER_ID_FOLDERS: ReadonlySet<string> = new Set([
  'lesson',
  'quiz',
]);

const LANGUAGE_DENIED =
  'You do not have permission to access this language resource';

/**
 * BE-03/BE-08: quién puede subir una imagen.
 *
 * `subjectId` es aquello sobre lo que se pide permiso:
 * - `user`: el usuario dueño del avatar (solo el propio, salvo admin).
 * - `languages`, `lesson`, `quiz`: el idioma. Para `lesson`/`quiz` el controlador lo
 *   resuelve del body y el id de la imagen lo genera el servidor, así que nadie puede
 *   sobrescribir una imagen ajena eligiendo su id.
 */
export async function assertImageUploadAllowed(
  actor: UploadActor,
  folder: string,
  subjectId: string,
  ports: UploadPolicyPorts,
): Promise<void> {
  if (!isUUID(subjectId)) {
    throw new BadRequestException('errors.common.invalidId');
  }
  if (actor.role === 'admin') {
    return;
  }
  if (actor.role !== 'moderator' && actor.role !== 'user') {
    throw new ForbiddenException(LANGUAGE_DENIED);
  }
  if (folder === 'user') {
    if (subjectId === actor.id) {
      return;
    }
    throw new ForbiddenException(
      'You can only upload your own profile picture',
    );
  }
  // Los alumnos solo pueden subir su propia foto.
  if (actor.role === 'user') {
    throw new ForbiddenException(LANGUAGE_DENIED);
  }
  if (folder !== 'languages' && !SERVER_ID_FOLDERS.has(folder)) {
    throw new ForbiddenException(LANGUAGE_DENIED);
  }
  if (!(await ports.hasLanguagePermission(actor.id, subjectId))) {
    throw new ForbiddenException(LANGUAGE_DENIED);
  }
}
