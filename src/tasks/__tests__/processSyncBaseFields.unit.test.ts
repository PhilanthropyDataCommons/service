import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import { processSyncBaseFields } from '../processSyncBaseFields';

describe('processSyncBaseFields', () => {
	it('should not error when passed an invalid payload', async () => {
		await expect(
			processSyncBaseFields({}, getMockJobHelpers()),
		).resolves.not.toThrow();
	});
});
