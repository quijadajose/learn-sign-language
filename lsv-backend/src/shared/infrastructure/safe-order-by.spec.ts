import { pickSafeOrderBy } from './safe-order-by';

describe('pickSafeOrderBy', () => {
  it('returns the column when it is in the allowlist', () => {
    expect(pickSafeOrderBy('id', ['id', 'createdAt'])).toBe('id');
  });

  it('drops unknown columns', () => {
    expect(pickSafeOrderBy('name', ['id'])).toBeUndefined();
  });

  it('drops injection-like identifiers', () => {
    expect(pickSafeOrderBy('id;drop', ['id'])).toBeUndefined();
    expect(pickSafeOrderBy('id DESC', ['id'])).toBeUndefined();
  });

  it('uses the fallback when the input is unsafe', () => {
    expect(pickSafeOrderBy('evil', ['id'], 'id')).toBe('id');
  });
});
