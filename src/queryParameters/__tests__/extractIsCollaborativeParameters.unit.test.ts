import { extractIsCollaborativeParameters } from '..';
import { InputValidationError } from '../../errors';

describe('extractIsCollaborativeParameters', () => {
	it('should return undefined when no isCollaborative parameter is provided', () => {
		const parameters = extractIsCollaborativeParameters({
			query: {},
		});
		expect(parameters).toEqual({
			isCollaborative: undefined,
		});
	});

	it('should return true when isCollaborative=true is provided', () => {
		const parameters = extractIsCollaborativeParameters({
			query: {
				isCollaborative: 'true',
			},
		});
		expect(parameters).toEqual({
			isCollaborative: true,
		});
	});

	it('should return false when isCollaborative=false is provided', () => {
		const parameters = extractIsCollaborativeParameters({
			query: {
				isCollaborative: 'false',
			},
		});
		expect(parameters).toEqual({
			isCollaborative: false,
		});
	});

	it('should throw an error when a non-boolean string is provided', () => {
		expect(() =>
			extractIsCollaborativeParameters({
				query: {
					isCollaborative: 'banana',
				},
			}),
		).toThrow(InputValidationError);
	});

	it('should throw an error when a numeric value is provided', () => {
		expect(() =>
			extractIsCollaborativeParameters({
				query: {
					isCollaborative: '1',
				},
			}),
		).toThrow(InputValidationError);
	});

	it('should throw an error when an empty string is provided', () => {
		expect(() =>
			extractIsCollaborativeParameters({
				query: {
					isCollaborative: '',
				},
			}),
		).toThrow(InputValidationError);
	});
});
