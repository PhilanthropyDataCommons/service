import { redactAllButFirstAndLastThreeDigits } from '../../logger';

describe('logger redaction function', () => {
  it('should redact all but six chars when given 50 digit secret', () => {
    const longishSecret = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX';
    const redacted = redactAllButFirstAndLastThreeDigits(longishSecret);
    expect(redacted).toBe('abc...[redacted]...VWX');
  });

  it('should redact all chars when given eight digit secret', () => {
    const shortishSecret = 'abcdefgh';
    const redacted = redactAllButFirstAndLastThreeDigits(shortishSecret);
    expect(redacted).toBe('[redacted a secret that was too short]');
  });
});
