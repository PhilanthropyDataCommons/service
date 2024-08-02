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
} from '../types';
import { DatabaseError, InputValidationError } from '../errors';
import {
	extractPaginationParameters,
	extractProposalParameters,
} from '../queryParameters';
import { OrganizationDetails } from '../types/OrganizationDetails';
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
			res.status(200).contentType('application/json').send(organization);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving organization.', error));
				return;
			}
			next(error);
		});
};

/** Takes a raw OrganizationDetails (with field values) and returns a better OrganizationDetails */
export const extractGold = (
	rawDetail: OrganizationDetails,
): OrganizationDetails => {
	// TODO: pick even better values based on `Source`, etc.
	const bestValues = new Map<BaseField, ProposalFieldValue>();
	rawDetail.allVisibleFieldValues.forEach((fieldValues, baseField) => {
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

	return {
		organization: rawDetail.organization,
		bestVisibleFieldValues: bestValues,
		allVisibleFieldValues: rawDetail.allVisibleFieldValues,
	};
};

const getOrganizationDetails = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const { organizationId } = req.params;
	if (!isId(organizationId)) {
		next(new InputValidationError('Invalid request body.', isId.errors ?? []));
		return;
	}
	loadBaseFields()
		.then((baseFields) => {
			// This could be a dedicated query but this is OK assuming only hundreds of base fields.
			const orgBaseFields = baseFields.filter(
				(f) => f.scope === BaseFieldScope.ORGANIZATION,
			);
			loadOrganization(organizationId)
				.then((organization) => {
					Promise.all(
						orgBaseFields.map((baseField) =>
							loadProposalFieldValuesByBaseFieldIdAndOrganizationId(
								baseField.id,
								organizationId,
							).then((fieldValues) => ({ baseField, fieldValues })),
						),
					)
						.then((fieldsAndValues) => {
							const allFieldValues = new Map<BaseField, ProposalFieldValue[]>();
							fieldsAndValues.map((entry) =>
								allFieldValues.set(entry.baseField, entry.fieldValues),
							);
							const rawOrganizationDetail: OrganizationDetails = {
								organization,
								bestVisibleFieldValues: new Map<
									BaseField,
									ProposalFieldValue
								>(),
								allVisibleFieldValues: allFieldValues,
							};
							const organizationDetail = extractGold(rawOrganizationDetail);
							res
								.status(200)
								.contentType('application/json')
								.send(organizationDetail);
						})
						.catch((error: unknown) => {
							if (isTinyPgErrorWithQueryContext(error)) {
								next(
									new DatabaseError(
										'Error retrieving proposal field values.',
										error,
									),
								);
								return;
							}
							next(error);
						});
				})
				.catch((error: unknown) => {
					if (isTinyPgErrorWithQueryContext(error)) {
						next(new DatabaseError('Error retrieving organization.', error));
						return;
					}
					next(error);
				});
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving base fields.', error));
				return;
			}
			next(error);
		});
};

export const organizationsHandlers = {
	postOrganization,
	getOrganizations,
	getOrganization,
	getOrganizationDetails,
};
