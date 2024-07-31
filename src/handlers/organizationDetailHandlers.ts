import { loadBaseFields, loadOrganization } from '../database';
import { BaseFieldScope, isId, isTinyPgErrorWithQueryContext } from '../types';
import { DatabaseError, InputValidationError } from '../errors';
import { OrganizationDetail } from '../types/OrganizationDetail';
import { loadProposalFieldValuesByBaseFieldId } from '../database/operations/load/loadProposalFieldValuesByBaseFieldId';
import type { Request, Response, NextFunction } from 'express';

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
	// TODO: load the base fields that are of scope ORGANIZATION, use those to get PFVs.
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
							loadProposalFieldValuesByBaseFieldId(bf.id),
						),
					)
						.then((fieldsAndValues) => {
							// TODO: we need to only find proposal and external field values associated with the org.
							// This will have to be a helper function somewhere because it's not explicit at the moment.
							// Since we'll have one base field per call to loadProposalFieldValuesByBaseFieldId, we can
							// make a map from either the id or the whole daggum base field. I think the latter is better.
							const allFieldValues = fieldsAndValues.flat();
							const organizationDetail: OrganizationDetail = {
								organization,
								// TODO: create and call a function that purifies gold from the larger list.
								bestAvailableFieldValues: [],
								allFieldValues,
							};
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
