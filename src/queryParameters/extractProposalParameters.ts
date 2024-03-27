import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';

interface ProposalParameters {
	proposalId: number | undefined;
}

interface ProposalParametersQuery {
	proposal: number | undefined;
}

const proposalParametersQuerySchema: JSONSchemaType<ProposalParametersQuery> = {
	type: 'object',
	properties: {
		proposal: {
			type: 'integer',
			minimum: 1,
			nullable: true,
		},
	},
	required: [],
};

const isProposalParametersQuery = ajv.compile(proposalParametersQuerySchema);

const extractProposalParameters = (request: Request): ProposalParameters => {
	const { query } = request;
	if (!isProposalParametersQuery(query)) {
		throw new InputValidationError(
			'Invalid proposal parameters.',
			isProposalParametersQuery.errors ?? [],
		);
	}
	return {
		proposalId: query.proposal,
	};
};

export { extractProposalParameters };
