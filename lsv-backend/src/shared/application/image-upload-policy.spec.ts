import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  assertImageUploadAllowed,
  UploadPolicyPorts,
} from './image-upload-policy.js';

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER_USER = '22222222-2222-4222-8222-222222222222';
const LANG = '33333333-3333-4333-8333-333333333333';
const OTHER_LANG = '44444444-4444-4444-8444-444444444444';
const LESSON_IN_LANG = '55555555-5555-4555-8555-555555555555';
const LESSON_OTHER = '66666666-6666-4666-8666-666666666666';
const QUIZ_IN_LANG = '77777777-7777-4777-8777-777777777777';

function makePorts(): UploadPolicyPorts {
  return {
    hasLanguagePermission: jest.fn(
      async (_userId: string, languageId: string) => languageId === LANG,
    ),
    resolveLanguageIdForLesson: jest.fn(async (lessonId: string) =>
      lessonId === LESSON_IN_LANG ? LANG : OTHER_LANG,
    ),
    resolveLanguageIdForQuiz: jest.fn(async () => LANG),
  };
}

describe('assertImageUploadAllowed (BE-08)', () => {
  it('lets admin upload into any folder without checks', async () => {
    const ports = makePorts();
    await expect(
      assertImageUploadAllowed(
        { id: USER, role: 'admin' },
        'languages',
        OTHER_LANG,
        ports,
      ),
    ).resolves.toBeUndefined();
    expect(ports.hasLanguagePermission).not.toHaveBeenCalled();
  });

  it('lets a moderator upload a language image when they have permission', async () => {
    await expect(
      assertImageUploadAllowed(
        { id: USER, role: 'moderator' },
        'languages',
        LANG,
        makePorts(),
      ),
    ).resolves.toBeUndefined();
  });

  it('blocks a moderator from another language', async () => {
    await expect(
      assertImageUploadAllowed(
        { id: USER, role: 'moderator' },
        'languages',
        OTHER_LANG,
        makePorts(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('checks the language of a lesson before allowing its image', async () => {
    const actor = { id: USER, role: 'moderator' };
    await expect(
      assertImageUploadAllowed(actor, 'lesson', LESSON_IN_LANG, makePorts()),
    ).resolves.toBeUndefined();
    await expect(
      assertImageUploadAllowed(actor, 'lesson', LESSON_OTHER, makePorts()),
    ).rejects.toThrow(ForbiddenException);
  });

  it('checks the language of a quiz before allowing its image', async () => {
    await expect(
      assertImageUploadAllowed(
        { id: USER, role: 'moderator' },
        'quiz',
        QUIZ_IN_LANG,
        makePorts(),
      ),
    ).resolves.toBeUndefined();
  });

  it('lets a moderator upload only their own profile picture', async () => {
    const actor = { id: USER, role: 'moderator' };
    await expect(
      assertImageUploadAllowed(actor, 'user', USER, makePorts()),
    ).resolves.toBeUndefined();
    await expect(
      assertImageUploadAllowed(actor, 'user', OTHER_USER, makePorts()),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lets a student upload their own profile picture', async () => {
    await expect(
      assertImageUploadAllowed(
        { id: USER, role: 'user' },
        'user',
        USER,
        makePorts(),
      ),
    ).resolves.toBeUndefined();
  });

  it("blocks a student from another user's avatar", async () => {
    await expect(
      assertImageUploadAllowed(
        { id: USER, role: 'user' },
        'user',
        OTHER_USER,
        makePorts(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('blocks a student from language, lesson and quiz folders', async () => {
    const actor = { id: USER, role: 'user' };
    const ports = makePorts();
    await expect(
      assertImageUploadAllowed(actor, 'languages', LANG, ports),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      assertImageUploadAllowed(actor, 'lesson', LESSON_IN_LANG, ports),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      assertImageUploadAllowed(actor, 'quiz', QUIZ_IN_LANG, ports),
    ).rejects.toThrow(ForbiddenException);
    expect(ports.hasLanguagePermission).not.toHaveBeenCalled();
  });

  it('rejects an unknown role', async () => {
    await expect(
      assertImageUploadAllowed(
        { id: USER, role: 'guest' },
        'user',
        USER,
        makePorts(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects a non-UUID id before touching the database', async () => {
    const ports = makePorts();
    await expect(
      assertImageUploadAllowed(
        { id: USER, role: 'moderator' },
        'lesson',
        '../../x',
        ports,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(ports.resolveLanguageIdForLesson).not.toHaveBeenCalled();
  });
});
