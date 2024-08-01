// TODO: I expect this and the corresponding function will be moved somewhere TBD.
// TODO: Add more meaningful tests.

import { Organization } from '../../types';
import { extractGold } from '../organizationDetailHandlers';

describe('extractGold', () => {
	it('should return same contents when empty allFieldValues is passed', () => {
		const organization: Organization = {
			id: 1,
			taxId: "0123456",
			name: "Mah org",
			createdAt: "2024-08-01T10:49:30-0600",
		};
		const organizationDetail = {
			organization,
			bestAvailableFieldValues: new Map(),
			allFieldValues: new Map(),
		};
		expect(extractGold(organizationDetail)).toEqual(organizationDetail);
	});
});

