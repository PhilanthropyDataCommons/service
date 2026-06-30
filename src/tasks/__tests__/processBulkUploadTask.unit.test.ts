import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import {
	assertControlColumnsAreValid,
	classifyHeaderRow,
	extractControlValues,
	getAlternativeRootPath,
	processBulkUploadTask,
} from '../processBulkUploadTask';

describe('processBulkUploadTask', () => {
	it('should not error when passed an invalid payload', async () => {
		await expect(
			processBulkUploadTask({}, getMockJobHelpers()),
		).resolves.not.toThrow();
	});
});

describe('classifyHeaderRow', () => {
	it('treats every column as a data column when none are prefixed', () => {
		expect(
			classifyHeaderRow(['proposal_submitter_email', 'organization_name']),
		).toEqual({
			dataColumnHeaders: [
				{ csvIndex: 0, label: 'proposal_submitter_email' },
				{ csvIndex: 1, label: 'organization_name' },
			],
			controlColumnHeaders: [],
		});
	});

	it('preserves the original csv index of a control column in any position', () => {
		expect(
			classifyHeaderRow([
				'proposal_submitter_email',
				'control:pdc_changemaker_id',
				'organization_name',
			]),
		).toEqual({
			dataColumnHeaders: [
				{ csvIndex: 0, label: 'proposal_submitter_email' },
				{ csvIndex: 2, label: 'organization_name' },
			],
			controlColumnHeaders: [{ csvIndex: 1, key: 'pdc_changemaker_id' }],
		});
	});

	it('trims whitespace around a control key', () => {
		expect(
			classifyHeaderRow(['control: pdc_changemaker_id ']).controlColumnHeaders,
		).toEqual([{ csvIndex: 0, key: 'pdc_changemaker_id' }]);
	});
});

describe('assertControlColumnsAreValid', () => {
	it('accepts a recognized control key', () => {
		expect(() => {
			assertControlColumnsAreValid({
				dataColumnHeaders: [],
				controlColumnHeaders: [{ csvIndex: 0, key: 'pdc_changemaker_id' }],
			});
		}).not.toThrow();
	});

	it('throws on an unrecognized control key', () => {
		expect(() => {
			assertControlColumnsAreValid({
				dataColumnHeaders: [],
				controlColumnHeaders: [{ csvIndex: 0, key: 'typo' }],
			});
		}).toThrow('unknown control key');
	});

	it('throws on a duplicated control key', () => {
		expect(() => {
			assertControlColumnsAreValid({
				dataColumnHeaders: [],
				controlColumnHeaders: [
					{ csvIndex: 0, key: 'pdc_changemaker_id' },
					{ csvIndex: 1, key: 'pdc_changemaker_id' },
				],
			});
		}).toThrow('more than one');
	});
});

describe('extractControlValues', () => {
	it('returns values keyed by control key', () => {
		const controlValues = extractControlValues(
			['foo@example.com', '42'],
			[{ csvIndex: 1, key: 'pdc_changemaker_id' }],
			1,
		);
		expect(controlValues.get('pdc_changemaker_id')).toBe('42');
	});

	it('omits empty values', () => {
		expect(
			extractControlValues(
				['foo@example.com', ''],
				[{ csvIndex: 1, key: 'pdc_changemaker_id' }],
				1,
			).has('pdc_changemaker_id'),
		).toBe(false);
	});

	it('omits values for control columns missing from a short record', () => {
		expect(
			extractControlValues(
				['foo@example.com'],
				[{ csvIndex: 1, key: 'pdc_changemaker_id' }],
				1,
			).size,
		).toBe(0);
	});

	it('throws when a control value has leading or trailing whitespace', () => {
		expect(() => {
			extractControlValues(
				['foo@example.com', ' 42 '],
				[{ csvIndex: 1, key: 'pdc_changemaker_id' }],
				1,
			);
		}).toThrow('whitespace');
	});

	it('throws when a control value is only whitespace', () => {
		expect(() => {
			extractControlValues(
				['foo@example.com', '   '],
				[{ csvIndex: 1, key: 'pdc_changemaker_id' }],
				1,
			);
		}).toThrow('whitespace');
	});
});

describe('getAlternativeRootPath', () => {
	it('returns the root folder name when all entries share a single root directory', () => {
		expect(
			getAlternativeRootPath({
				'folder/': { isDirectory: true },
				'folder/one.txt': { isDirectory: false },
				'folder/two.txt': { isDirectory: false },
			}),
		).toEqual('folder');
	});

	it('returns null when there are multiple root-level names', () => {
		expect(
			getAlternativeRootPath({
				'a/': { isDirectory: true },
				'a/file.txt': { isDirectory: false },
				'b/': { isDirectory: true },
				'b/file.txt': { isDirectory: false },
			}),
		).toBeNull();
	});

	it('returns null when there is a root-level file', () => {
		expect(
			getAlternativeRootPath({
				'folder/': { isDirectory: true },
				'folder/file.txt': { isDirectory: false },
				'root.txt': { isDirectory: false },
			}),
		).toBeNull();
	});

	it('returns null when there is only a single root-level file and no folder', () => {
		expect(
			getAlternativeRootPath({
				'file.txt': { isDirectory: false },
			}),
		).toBeNull();
	});

	it('returns null for an empty entries object', () => {
		expect(getAlternativeRootPath({})).toBeNull();
	});
});
