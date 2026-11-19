import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  assertImageUploadAllowed,
  UploadPolicyPorts,
} from './image-upload-policy.js';

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER_USER = '22222222-2222-4222-8222-222222222222';
const LANG = '33333333-3333-4333-8333-333333333333';
const OTHER_LANG = '44444444-4444-4444-8444-444444444444';

function makePorts(): UploadPolicyPorts {
  return {
    hasLanguagePermission: jest.fn(
      async (_userId: string, languageId: string) => languageId === LANG,
    ),
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

  it('authorizes lesson and quiz images by language (the subject is the language)', async () => {
    const actor = { id: USER, role: 'moderator' };
    for (const folder of ['lesson', 'quiz']) {
      await expect(
        assertImageUploadAllowed(actor, folder, LANG, makePorts()),
      ).resolves.toBeUndefined();
      await expect(
        assertImageUploadAllowed(actor, folder, OTHER_LANG, makePorts()),
      ).rejects.toThrow(ForbiddenException);
    }
  });

  it('blocks a moderator from an unknown folder', async () => {
    await expect(
      assertImageUploadAllowed(
        { id: USER, role: 'moderator' },
        'other',
        LANG,
        makePorts(),
      ),
    ).rejects.toThrow(ForbiddenException);
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
      assertImageUploadAllowed(actor, 'lesson', LANG, ports),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      assertImageUploadAllowed(actor, 'quiz', LANG, ports),
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
    expect(ports.hasLanguagePermission).not.toHaveBeenCalled();
  });
});
