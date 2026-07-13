import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { shortCodeSchema } from '../types';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { ShortCode } from '../types';

interface DataProviderParameters {
	dataProviderShortCode: ShortCode | undefined;
}

interface DataProviderParametersQuery {
	dataProvider: ShortCode | undefined;
}

const dataProviderParametersQuerySchema: JSONSchemaType<DataProviderParametersQuery> =
	{
		type: 'object',
		properties: {
			dataProvider: {
				...shortCodeSchema,
				nullable: true,
			},
		},
		required: [],
	};

const isDataProviderParametersQuery = ajv.compile(
	dataProviderParametersQuerySchema,
);

const extractDataProviderParameters = (
	request: Request,
): DataProviderParameters => {
	const { query } = request;
	if (!isDataProviderParametersQuery(query)) {
		throw new InputValidationError(
			'Invalid data provider parameters.',
			isDataProviderParametersQuery.errors ?? [],
		);
	}
	return {
		dataProviderShortCode: query.dataProvider,
	};
};

export { extractDataProviderParameters };
