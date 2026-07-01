WITH
	updated_changemaker AS (
		UPDATE changemakers
		SET
			tax_id = update_if(:taxIdWasProvided, :taxId, tax_id),
			name = update_if(:nameWasProvided, :name, name),
			keycloak_organization_id = update_if(
				:keycloakOrganizationIdWasProvided,
				:keycloakOrganizationId,
				keycloak_organization_id
			)
		WHERE id = :changemakerId
		RETURNING *
	)

SELECT serialized_changemaker.object
FROM build_changemakers_results(
	array(SELECT updated_changemaker::changemakers FROM updated_changemaker),
	:authContextKeycloakUserId,
	:authContextIsAdministrator
) AS serialized_changemaker;
