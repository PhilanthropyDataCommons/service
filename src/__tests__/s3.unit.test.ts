import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import {
	endpointRequiresPathStyle,
	generatePresignedDownloadUrl,
	generatePresignedPost,
	getS3Client,
	parseOptionalBoolean,
} from '../s3';

jest.mock('@aws-sdk/s3-presigned-post');

const mockedCreatePresignedPost = jest.mocked(createPresignedPost);

describe('generatePresignedPost', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('calls createPresignedPost with correct parameters', async () => {
		const mockPresignedPost = {
			url: 'https://example.com/presigned-url',
			fields: {
				key: 'test-key',
				Policy: 'mock-policy',
			},
		};

		mockedCreatePresignedPost.mockResolvedValue(mockPresignedPost);

		const result = await generatePresignedPost(
			'test-key',
			'application/pdf',
			1024,
		);

		expect(mockedCreatePresignedPost).toHaveBeenCalledWith(getS3Client(), {
			Bucket: process.env.S3_BUCKET,
			Key: 'test-key',
			Expires: 3600,
			Conditions: [
				['eq', '$Content-Type', 'application/pdf'],
				['content-length-range', 1024, 1024],
			],
		});

		expect(result).toEqual(mockPresignedPost);
	});

	it('handles different mime types correctly', async () => {
		const mockPresignedPost = {
			url: 'https://example.com/presigned-url',
			fields: {
				key: 'test-key',
				Policy: 'mock-policy',
			},
		};

		mockedCreatePresignedPost.mockResolvedValue(mockPresignedPost);

		await generatePresignedPost('test-key', 'text/plain', 512);

		expect(mockedCreatePresignedPost).toHaveBeenCalledWith(getS3Client(), {
			Bucket: process.env.S3_BUCKET,
			Key: 'test-key',
			Expires: 3600,
			Conditions: [
				['eq', '$Content-Type', 'text/plain'],
				['content-length-range', 512, 512],
			],
		});
	});

	it('handles different file sizes correctly', async () => {
		const mockPresignedPost = {
			url: 'https://example.com/presigned-url',
			fields: {
				key: 'test-key',
				Policy: 'mock-policy',
			},
		};

		mockedCreatePresignedPost.mockResolvedValue(mockPresignedPost);

		await generatePresignedPost('test-key', 'image/png', 2048);

		expect(mockedCreatePresignedPost).toHaveBeenCalledWith(getS3Client(), {
			Bucket: process.env.S3_BUCKET,
			Key: 'test-key',
			Expires: 3600,
			Conditions: [
				['eq', '$Content-Type', 'image/png'],
				['content-length-range', 2048, 2048],
			],
		});
	});

	it('propagates errors from createPresignedPost', async () => {
		const mockError = new Error('S3 API error');
		mockedCreatePresignedPost.mockRejectedValue(mockError);

		await expect(
			generatePresignedPost('test-key', 'application/pdf', 1024),
		).rejects.toThrow('S3 API error');
	});
});

describe('generatePresignedDownloadUrl', () => {
	it('asks S3 to serve the file as an attachment', async () => {
		const url = new URL(
			await generatePresignedDownloadUrl('test-key', 'chart.png'),
		);

		expect(url.searchParams.get('response-content-disposition')).toBe(
			'attachment; filename=chart.png',
		);
	});
});

describe('endpointRequiresPathStyle', () => {
	it.each([
		['http://pdc-s3:9300', true],
		['http://localhost:9000', true],
		['http://127.0.0.1:9000', true],
		['http://[::1]:9000', true],
		['https://s3.us-east-1.amazonaws.com', false],
		['https://nyc3.digitaloceanspaces.com', false],
	])('returns %s for %s', (endpoint, expected) => {
		expect(endpointRequiresPathStyle(endpoint)).toBe(expected);
	});
});

describe('parseOptionalBoolean', () => {
	it.each([
		[undefined, undefined],
		['', undefined],
		['true', true],
		['false', false],
	])('parses %p as %p', (value, expected) => {
		expect(parseOptionalBoolean(value)).toBe(expected);
	});
});
