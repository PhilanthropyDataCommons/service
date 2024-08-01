import { loadBaseFields, loadOrganization } from '../database';
import {
	BaseField,
	BaseFieldScope,
	isId,
	isTinyPgErrorWithQueryContext,
	ProposalFieldValue,
} from '../types';
import { DatabaseError, InputValidationError } from '../errors';
import { OrganizationDetail } from '../types/OrganizationDetail';
import { loadProposalFieldValuesByBaseFieldIdAndOrganizationId } from '../database/operations/load/loadProposalFieldValuesByBaseFieldIdAndOrganizationId';
import type { Request, Response, NextFunction } from 'express';

/** Takes a raw OrganizationDetail (with field values) and returns a better OrganizationDetail */
export const extractGold = (
	rawDetail: OrganizationDetail,
): OrganizationDetail => {
	// TODO: pick even better values based on `Source`, etc.
	const bestValues = new Map<BaseField, ProposalFieldValue>();
	rawDetail.allFieldValues.forEach((fieldValues, baseField) => {
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
		bestAvailableFieldValues: bestValues,
		allFieldValues: rawDetail.allFieldValues,
	};
};

const getOrganizationDetail = (
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
							const rawOrganizationDetail: OrganizationDetail = {
								organization,
								bestAvailableFieldValues: new Map<
									BaseField,
									ProposalFieldValue
								>(),
								allFieldValues,
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

export const organizationDetailHandlers = {
	getOrganizationDetail,
};
