import { HTTP_STATUS } from '../constants';
import { ajv } from '../ajv';
import { db } from '../database';
import { isTinyPgErrorWithQueryContext } from '../types';
import { DatabaseError, InputValidationError } from '../errors';
import type { Request, Response, NextFunction } from 'express';
import type { JSONSchemaType } from 'ajv';
import type { PlatformProviderResponse } from '../types';

interface GetPlatformProviderResponseByExternalIdParams {
	externalId: string;
}
const getPlatformProviderResponsesByExternalIdParamsSchema: JSONSchemaType<GetPlatformProviderResponseByExternalIdParams> =
	{
		type: 'object',
		properties: {
			externalId: {
				type: 'string',
			},
		},
		required: ['externalId'],
	};
const isGetPlatformProviderResponsesByExternalIdParams = ajv.compile(
	getPlatformProviderResponsesByExternalIdParamsSchema,
);
const getPlatformProviderResponsesByExternalId = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isGetPlatformProviderResponsesByExternalIdParams(req.query)) {
		next(
			new InputValidationError(
				'Invalid request parameters.',
				isGetPlatformProviderResponsesByExternalIdParams.errors ?? [],
			),
		);
		return;
	}
	db.sql<PlatformProviderResponse>(
		'platformProviderResponses.selectByExternalId',
		{ externalId: req.query.externalId },
	)
		.then((platformProviderResponsesQueryResult) => {
			const { rows: platformProviderResponses } =
				platformProviderResponsesQueryResult;
			res
				.status(HTTP_STATUS.SUCCESSFUL.OK)
				.contentType('application/json')
				.send(platformProviderResponses);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(
					new DatabaseError(
						'Error retrieving platform provider responses.',
						error,
					),
				);
				return;
			}
			next(error);
		});
};

type PostPlatformProviderResponse = Omit<PlatformProviderResponse, 'createdAt'>;
const postPlatformProviderResponseSchema: JSONSchemaType<PostPlatformProviderResponse> =
	{
		type: 'object',
		properties: {
			externalId: {
				type: 'string',
			},
			platformProvider: {
				type: 'string',
			},
			data: {
				type: 'object',
			},
		},
		required: ['externalId', 'platformProvider', 'data'],
	};
const isPostPlatformProviderResponseSchema = ajv.compile(
	postPlatformProviderResponseSchema,
);
const postPlatformProviderResponse = (
	req: Request<unknown, unknown, PostPlatformProviderResponse>,
	res: Response,
	next: NextFunction,
): void => {
	if (!isPostPlatformProviderResponseSchema(req.body)) {
		next(
			new InputValidationError(
				'Invalid request parameters.',
				isPostPlatformProviderResponseSchema.errors ?? [],
			),
		);
		return;
	}

	db.sql<PlatformProviderResponse>(
		'platformProviderResponses.insertOne',
		req.body,
	)
		.then((opportunitiesQueryResult) => {
			const [platformProviderResponse] = opportunitiesQueryResult.rows;
			res
				.status(HTTP_STATUS.SUCCESSFUL.CREATED)
				.contentType('application/json')
				.send(platformProviderResponse);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(
					new DatabaseError(
						'Error creating platform provider response.',
						error,
					),
				);
				return;
			}
			next(error);
		});
};

export const platformProviderResponsesHandlers = {
	getPlatformProviderResponsesByExternalId,
	postPlatformProviderResponse,
};
