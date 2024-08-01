import { loadBaseFields, loadOrganization } from '../database';
import { BaseFieldScope, isId, isTinyPgErrorWithQueryContext } from '../types';
import { DatabaseError, InputValidationError } from '../errors';
import { OrganizationDetail } from '../types/OrganizationDetail';
import { loadProposalFieldValuesByBaseFieldIdAndOrganizationId } from '../database/operations/load/loadProposalFieldValuesByBaseFieldIdAndOrganizationId';
import type { Request, Response, NextFunction } from 'express';

/** Takes a raw OrganizationDetail (with field values) and returns a better OrganizationDetail */
const extractGold = (rawDetail: OrganizationDetail): OrganizationDetail => {
	// TODO: actually pick best values
	const bestValues = rawDetail.bestAvailableFieldValues;
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
					// TODO: keep the context of the base field ID around.
					Promise.all(
						orgBaseFields.map((bf) =>
							loadProposalFieldValuesByBaseFieldIdAndOrganizationId(
								bf.id,
								organizationId,
							),
						),
					)
						.then((fieldsAndValues) => {
							// Since we'll have one base field per call to `loadProposalFieldValuesBy...`, we can
							// make a map from either the id or the whole base field to pfvs. I lean latter.
							const allFieldValues = fieldsAndValues.flat();
							const rawOrganizationDetail: OrganizationDetail = {
								organization,
								bestAvailableFieldValues: [],
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
