SELECT organization_to_json(
	:keycloakOrganizationId,
	:authContextKeycloakUserId,
	:authContextIsAdministrator,
	:authContextCanViewOrganizationsInKeycloak,
	:authContextCanViewUsersInKeycloak
) AS object;
