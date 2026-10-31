import { safeNext } from './safe-next';

describe('safeNext', () => {
  it('keeps internal paths', () => {
    expect(safeNext('/accounts?customer=2')).toBe('/accounts?customer=2');
  });

  it('refuses other sites', () => {
    for (const next of ['//evil.test', '/\\evil.test', 'https://evil.test', undefined]) expect(safeNext(next)).toBe('/');
  });
});
