import { parseAmount } from './amount';

describe('parseAmount', () => {
  it('keeps the cents', () => {
    expect(parseAmount('1234.56')).toBe(1234.56);
    expect(parseAmount('1 234,56')).toBe(1234.56);
  });

  it('refuses ambiguous or invalid amounts', () => {
    for (const text of ['', '-5', '1234.', '1.234,56', '1e6', '10.999']) expect(parseAmount(text)).toBeNull();
  });
});
