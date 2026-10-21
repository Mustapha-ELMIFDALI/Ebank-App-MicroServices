import { engrave } from './engraving';

describe('engrave', () => {
  it('gives the same seal to the same id', () => {
    expect(engrave('account-1')).toEqual(engrave('account-1'));
  });

  it('gives different seals to different ids', () => {
    expect(engrave('account-1')).not.toEqual(engrave('account-2'));
  });
});
