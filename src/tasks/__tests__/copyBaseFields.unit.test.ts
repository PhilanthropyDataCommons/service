import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import { copyBaseFields } from '../copyBaseFields';

describe('copyBaseFields', () => {
	it('should not error when passed an invalid payload', async () => {
		await expect(
			copyBaseFields({}, getMockJobHelpers()),
		).resolves.not.toThrow();
	});
});
