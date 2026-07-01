WITH
	inserted_changemaker AS (
		INSERT INTO changemakers (
			tax_id,
			name,
			keycloak_organization_id,
			created_by
		) VALUES (
			:taxId,
			:name,
			:keycloakOrganizationId,
			:authContextKeycloakUserId
		)
		RETURNING *
	)

SELECT serialized_changemaker.object
FROM build_changemakers_results(
	array(SELECT inserted_changemaker::changemakers FROM inserted_changemaker),
	:authContextKeycloakUserId,
	FALSE
) AS serialized_changemaker;
