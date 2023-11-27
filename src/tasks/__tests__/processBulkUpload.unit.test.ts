import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import { processBulkUpload } from '../processBulkUpload';
import { InternalValidationError } from '../../errors';

describe('processBulkUpload', () => {
  it('should error when passed an invalid payload', async () => {
    await expect(processBulkUpload(
      {},
      getMockJobHelpers(),
    )).rejects.toBeInstanceOf(InternalValidationError);
  });
});
