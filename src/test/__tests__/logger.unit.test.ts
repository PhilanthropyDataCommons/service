import { redactToPreventAuthReplay } from '../../logger';

describe('logger redaction function', () => {
	it('should redact the signature of the JWT', () => {
		const longishSecret = 'Bearer asdf.gh.jkl';
		const redacted = redactToPreventAuthReplay(longishSecret, [
			'req',
			'headers',
			'authorization',
		]);
		expect(redacted).toBe('Bearer asdf.gh.[redacted]');
	});

	it('should redact nothing when no second dot is present', () => {
		const shortishSecret = 'Bearer abcdefgh';
		const redacted = redactToPreventAuthReplay(shortishSecret, [
			'req',
			'headers',
			'authorization',
		]);
		expect(redacted).toBe('Bearer abcdefgh');
	});

	it('should let us know when a weird authorization value is sent via pino', () => {
		const weirdThingToSend = [{}];
		expect(() =>
			redactToPreventAuthReplay(weirdThingToSend, [
				'req',
				'headers',
				'authorization',
			]),
		).toThrow();
	});

	it('should not let us know when a weird non-authorization value is sent via pino', () => {
		const weirdThingToSend = [{}];
		const redacted = redactToPreventAuthReplay(weirdThingToSend, ['req']);
		expect(redacted).toStrictEqual(weirdThingToSend);
	});
});
