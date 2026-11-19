INSERT INTO sources (
	label,
	data_provider_short_code,
	funder_short_code,
	changemaker_id,
	created_by
)
VALUES (
	:label,
	:dataProviderShortCode,
	:funderShortCode,
	:changemakerId,
	auth_context_user_keycloak_user_id(:authContextId)
)
RETURNING source_to_json(
	sources,
	:authContextId,
	:authContextIsAdministrator
) AS object;
