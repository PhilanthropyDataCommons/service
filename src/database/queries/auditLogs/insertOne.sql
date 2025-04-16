INSERT INTO audit_logs_2 (
	user_keycloak_user_id,
	query_name,
	query_parameters
) VALUES (
	:authContextKeycloakUserId,
	:queryName,
	:queryParameters
);
