import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { idSchema } from '../types';
import { coerceQuery } from '../coercion';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { Id } from '../types';

interface ProposalParameters {
	proposalId: Id | undefined;
}

interface ProposalParametersQuery {
	proposal: Id | undefined;
}

const proposalParametersQuerySchema: JSONSchemaType<ProposalParametersQuery> = {
	type: 'object',
	properties: {
		proposal: {
			...idSchema,
			nullable: true,
		},
	},
	required: [],
};

const isProposalParametersQuery = ajv.compile(proposalParametersQuerySchema);

const extractProposalParameters = (request: Request): ProposalParameters => {
	const { query } = request;
	const coercedQuery = coerceQuery(query);
	if (!isProposalParametersQuery(coercedQuery)) {
		throw new InputValidationError(
			'Invalid proposal parameters.',
			isProposalParametersQuery.errors ?? [],
		);
	}
	return {
		proposalId: coercedQuery.proposal,
	};
};

export { extractProposalParameters };
