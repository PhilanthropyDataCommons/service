import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import {
	detectNestedRootFolder,
	processBulkUploadTask,
} from '../processBulkUploadTask';

describe('processBulkUploadTask', () => {
	it('should not error when passed an invalid payload', async () => {
		await expect(
			processBulkUploadTask({}, getMockJobHelpers()),
		).resolves.not.toThrow();
	});
});

describe('detectNestedRootFolder', () => {
	it('returns the root folder name when all entries share a single root directory', () => {
		expect(
			detectNestedRootFolder({
				'folder/': { isDirectory: true },
				'folder/one.txt': { isDirectory: false },
				'folder/two.txt': { isDirectory: false },
			}),
		).toEqual('folder');
	});

	it('returns null when there are multiple root-level names', () => {
		expect(
			detectNestedRootFolder({
				'a/': { isDirectory: true },
				'a/file.txt': { isDirectory: false },
				'b/': { isDirectory: true },
				'b/file.txt': { isDirectory: false },
			}),
		).toBeNull();
	});

	it('returns null when there is a root-level file', () => {
		expect(
			detectNestedRootFolder({
				'folder/': { isDirectory: true },
				'folder/file.txt': { isDirectory: false },
				'root.txt': { isDirectory: false },
			}),
		).toBeNull();
	});

	it('returns null when there is only a single root-level file and no folder', () => {
		expect(
			detectNestedRootFolder({
				'file.txt': { isDirectory: false },
			}),
		).toBeNull();
	});

	it('returns null for an empty entries object', () => {
		expect(detectNestedRootFolder({})).toBeNull();
	});
});
