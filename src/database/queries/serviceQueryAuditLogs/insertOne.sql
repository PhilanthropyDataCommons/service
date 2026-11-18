INSERT INTO service_query_audit_logs (
	user_keycloak_user_id,
	user_is_administrator,
	query_name,
	query_parameters
) VALUES (
	auth_context_user_keycloak_user_id(:authContextId),
	:authContextIsAdministrator,
	:queryName,
	:queryParameters
);
