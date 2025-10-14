import { sanitizeUrl } from '../sanitizeUrl';

describe('sanitizeUrl', () => {
  it('removes backticks from URL', () => {
    const input = '`https://checkout.monnify.com/test`';
    const expected = 'https://checkout.monnify.com/test';
    expect(sanitizeUrl(input)).toBe(expected);
  });

  it('removes quotes from URL', () => {
    const input = '"https://checkout.monnify.com/test"';
    const expected = 'https://checkout.monnify.com/test';
    expect(sanitizeUrl(input)).toBe(expected);
  });

  it('removes brackets from URL', () => {
    const input = '[https://checkout.monnify.com/test]';
    const expected = 'https://checkout.monnify.com/test';
    expect(sanitizeUrl(input)).toBe(expected);
  });

  it('removes trailing commas', () => {
    const input = 'https://checkout.monnify.com/test,';
    const expected = 'https://checkout.monnify.com/test';
    expect(sanitizeUrl(input)).toBe(expected);
  });

  it('removes whitespace', () => {
    const input = '  https://checkout.monnify.com/test  ';
    const expected = 'https://checkout.monnify.com/test';
    expect(sanitizeUrl(input)).toBe(expected);
  });

  it('handles complex malformed URL', () => {
    const input = '`"[  https://checkout.monnify.com/test  ],"`';
    const expected = 'https://checkout.monnify.com/test';
    expect(sanitizeUrl(input)).toBe(expected);
  });

  it('returns clean URL unchanged', () => {
    const input = 'https://checkout.monnify.com/test';
    const expected = 'https://checkout.monnify.com/test';
    expect(sanitizeUrl(input)).toBe(expected);
  });
});