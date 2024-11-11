import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import { processBulkUploadTask } from '../processBulkUploadTask';

describe('processBulkUploadTask', () => {
	it('should not error when passed an invalid payload', async () => {
		await expect(
			processBulkUploadTask({}, getMockJobHelpers()),
		).resolves.not.toThrow();
	});
});
