SELECT organization_to_json(
	:keycloakOrganizationId,
	:authContextId,
	:authContextIsAdministrator,
	:authContextCanViewOrganizationsInKeycloak,
	:authContextCanViewUsersInKeycloak
) AS object;
