import { resolveVisibleLanguageIds } from './language-visibility.js';

describe('resolveVisibleLanguageIds', () => {
  const makePort = (ids: string[] = []) => ({
    findAccessibleLanguageIds: jest.fn().mockResolvedValue(ids),
  });

  it('does not filter for admins', async () => {
    const port = makePort(['lang-1']);
    const result = await resolveVisibleLanguageIds(
      { sub: 'admin-1', role: 'admin' },
      port,
    );
    expect(result).toBeUndefined();
    expect(port.findAccessibleLanguageIds).not.toHaveBeenCalled();
  });

  it('limits moderators to their accessible languages', async () => {
    const port = makePort(['lang-1', 'lang-2']);
    const result = await resolveVisibleLanguageIds(
      { sub: 'mod-1', role: 'moderator' },
      port,
    );
    expect(result).toEqual(['lang-1', 'lang-2']);
    expect(port.findAccessibleLanguageIds).toHaveBeenCalledWith('mod-1');
  });

  it('returns an empty list for moderators without permissions', async () => {
    const result = await resolveVisibleLanguageIds(
      { sub: 'mod-2', role: 'moderator' },
      makePort([]),
    );
    expect(result).toEqual([]);
  });

  it('returns an empty list for other roles', async () => {
    const port = makePort(['lang-1']);
    const result = await resolveVisibleLanguageIds(
      { sub: 'user-1', role: 'user' },
      port,
    );
    expect(result).toEqual([]);
    expect(port.findAccessibleLanguageIds).not.toHaveBeenCalled();
  });
});
