import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import { processBulkUpload } from '../processBulkUpload';

describe('processBulkUpload', () => {
  it('should not error when passed an invalid payload', async () => {
    await expect(processBulkUpload(
      {},
      getMockJobHelpers(),
    )).resolves.not.toThrow();
  });
});
