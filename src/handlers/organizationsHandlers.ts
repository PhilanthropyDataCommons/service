import {
	getLimitValues,
	loadOrganizationBundle,
	loadOrganization,
	createOrganization,
	loadBaseFields,
} from '../database';
import {
	isId,
	isWritableOrganization,
	isTinyPgErrorWithQueryContext,
	BaseField,
	ProposalFieldValue,
	BaseFieldScope,
	Organization,
} from '../types';
import { DatabaseError, InputValidationError } from '../errors';
import {
	extractPaginationParameters,
	extractProposalParameters,
} from '../queryParameters';
import { loadProposalFieldValuesByBaseFieldIdAndOrganizationId } from '../database/operations/load/loadProposalFieldValuesByBaseFieldIdAndOrganizationId';
import type { Request, Response, NextFunction } from 'express';

const postOrganization = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isWritableOrganization(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableOrganization.errors ?? [],
			),
		);
		return;
	}
	createOrganization(req.body)
		.then((organization) => {
			res.status(201).contentType('application/json').send(organization);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error creating base field.', error));
				return;
			}
			next(error);
		});
};

const getOrganizations = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const paginationParameters = extractPaginationParameters(req);
	const proposalParameters = extractProposalParameters(req);
	loadOrganizationBundle({
		...getLimitValues(paginationParameters),
		...proposalParameters,
	})
		.then((organizationBundle) => {
			res.status(200).contentType('application/json').send(organizationBundle);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving organizations.', error));
				return;
			}
			next(error);
		});
};

/** Takes a map of base fields to array of field values and returns a map of base fields to single best value */
export const extractGold = (
	rawDetail: Map<BaseField, ProposalFieldValue[]>,
): Map<BaseField, ProposalFieldValue> => {
	// TODO: pick even better values based on `Source`, etc.
	const bestValues = new Map<BaseField, ProposalFieldValue>();
	rawDetail.forEach((fieldValues, baseField) => {
		const validFieldValues = fieldValues.filter((value) => value.isValid);
		// Simplest case: after filtering for validity, we have nothing left. Skip it.
		if (validFieldValues.length === 0) {
			return;
		}
		// After filtering, only one value is left. It is therefore the only candidate, so use it.
		if (validFieldValues.length === 1 && validFieldValues[0] !== undefined) {
			bestValues.set(baseField, validFieldValues[0]);
			return;
		}
		// N (not 0, not 1) candidates remain.
		// Sort by insert date (latest first). The `createdAt` property is not a Date for reasons explained
		// at https://github.com/PhilanthropyDataCommons/service/issues/862.
		// Lexical order should be date order so we could avoid creating new objects here.
		validFieldValues.sort(
			(a, b) =>
				new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf(),
		);
		// Because we want to choose exactly one here, I think imperative iteration is key.
		for (let i = 0; i < validFieldValues.length; i += 1) {
			// Choose the first not-undefined one (should be the first).
			const fieldValue = validFieldValues[i];
			if (fieldValue !== undefined) {
				bestValues.set(baseField, fieldValue);
				return;
			}
		}
	});

	return bestValues;
};

// TODO: refactor error handling now that this is not middleware.
const getFieldValues = (organization: Organization): void => {
	loadBaseFields()
		.then((baseFields) => {
			// This could be a dedicated query but this is OK assuming only hundreds of base fields.
			const orgBaseFields = baseFields.filter(
				(f) => f.scope === BaseFieldScope.ORGANIZATION,
			);
			Promise.all(
				orgBaseFields.map((baseField) =>
					loadProposalFieldValuesByBaseFieldIdAndOrganizationId(
						baseField.id,
						organization.id,
					).then((fieldValues) => ({ baseField, fieldValues })),
				),
			)
				.then((fieldsAndValues) => {
					const allFieldValues = new Map<BaseField, ProposalFieldValue[]>();
					fieldsAndValues.map((entry) =>
						allFieldValues.set(entry.baseField, entry.fieldValues),
					);
					return extractGold(allFieldValues);
				})
				.catch((error: unknown) => {
					if (isTinyPgErrorWithQueryContext(error)) {
						throw new DatabaseError(
							'Error retrieving proposal field values.',
							error,
						);
					}
					throw error;
				});
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				throw new DatabaseError('Error retrieving organization.', error);
			}
			throw error;
		});
};

const getOrganization = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const { organizationId } = req.params;
	if (!isId(organizationId)) {
		next(new InputValidationError('Invalid request body.', isId.errors ?? []));
		return;
	}
	loadOrganization(organizationId)
		.then((organization) => {
			// When no authenticated user is present, don't bother diving into field values.
			if (req.user === undefined) {
				res.status(200).contentType('application/json').send(organization);
				return;
			}
			// TODO: better integrate such that pagination works too.
			const organizationWithFieldValues = {
				...organization,
				fieldValues: getFieldValues(organization),
			};
			res
				.status(200)
				.contentType('application/json')
				.send(organizationWithFieldValues);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving organization.', error));
				return;
			}
			next(error);
		});
};

export const organizationsHandlers = {
	postOrganization,
	getOrganizations,
	getOrganization,
};
