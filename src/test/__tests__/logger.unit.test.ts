import { redactToPreventAuthReplay } from '../../logger';

describe('logger redaction function', () => {
	it('should redact the signature of the JWT', () => {
		const longishSecret = 'Bearer asdf.gh.jkl';
		const redacted = redactToPreventAuthReplay(longishSecret);
		expect(redacted).toBe('Bearer asdf.gh.[redacted]');
	});

	it('should redact nothing when no second dot is present', () => {
		const shortishSecret = 'Bearer abcdefgh';
		const redacted = redactToPreventAuthReplay(shortishSecret);
		expect(redacted).toBe('Bearer abcdefgh');
	});
});
