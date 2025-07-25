SELECT organization_to_json(
	:keycloakOrganizationId,
	:authContextKeycloakUserId,
	:authContextIsAdministrator
) AS object;
