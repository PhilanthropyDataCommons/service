import { epochSecondsToIsoString } from '../epochSecondsToIsoString';

describe('epochSecondsToIsoString', () => {
	it('converts the epoch to its ISO string', () => {
		expect(epochSecondsToIsoString(0)).toEqual('1970-01-01T00:00:00.000Z');
	});

	it('converts seconds since the epoch to an ISO string', () => {
		expect(epochSecondsToIsoString(1700000000)).toEqual(
			'2023-11-14T22:13:20.000Z',
		);
	});
});
