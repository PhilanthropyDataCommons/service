INSERT INTO opportunities (
	title,
	funder_short_code,
	terminology_set_id,
	created_by
) VALUES (
	:title,
	:funderShortCode::short_code_t,
	:terminologySetId::int,
	auth_context_user_keycloak_user_id(:authContextId)
)
RETURNING opportunity_to_json(
	opportunities,
	:authContextId,
	:authContextIsAdministrator
) AS object;
