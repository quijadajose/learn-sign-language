import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { isUUID } from 'class-validator';

export type UploadActor = { id: string; role: string };

export type UploadPolicyPorts = {
  hasLanguagePermission(userId: string, languageId: string): Promise<boolean>;
  resolveLanguageIdForLesson(lessonId: string): Promise<string | null>;
  resolveLanguageIdForQuiz(quizId: string): Promise<string | null>;
};

const LANGUAGE_DENIED =
  'You do not have permission to access this language resource';

/**
 * BE-03/BE-08: con el rol moderador activo, el upload no puede sobrescribir
 * imágenes ajenas. Admin no tiene restricción. Un moderador solo sube imágenes
 * de idiomas donde tiene permiso (languages, lesson, quiz) y su propio avatar.
 */
export async function assertImageUploadAllowed(
  actor: UploadActor,
  folder: string,
  id: string,
  ports: UploadPolicyPorts,
): Promise<void> {
  if (!isUUID(id)) {
    throw new BadRequestException('Invalid image id');
  }
  if (actor.role === 'admin') {
    return;
  }
  if (actor.role !== 'moderator' && actor.role !== 'user') {
    throw new ForbiddenException(LANGUAGE_DENIED);
  }
  if (folder === 'user') {
    if (id === actor.id) {
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

  let languageId: string | null = null;
  if (folder === 'languages') {
    languageId = id;
  } else if (folder === 'lesson') {
    languageId = await ports.resolveLanguageIdForLesson(id);
  } else if (folder === 'quiz') {
    languageId = await ports.resolveLanguageIdForQuiz(id);
  }

  if (
    !languageId ||
    !(await ports.hasLanguagePermission(actor.id, languageId))
  ) {
    throw new ForbiddenException(LANGUAGE_DENIED);
  }
}
