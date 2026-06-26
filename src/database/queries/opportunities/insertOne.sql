INSERT INTO opportunities (
	title,
	funder_short_code,
	terminology_set_id,
	created_by
) VALUES (
	:title,
	:funderShortCode::short_code_t,
	:terminologySetId::int,
	:authContextKeycloakUserId
)
RETURNING opportunity_to_json(
	opportunities,
	:authContextKeycloakUserId,
	:authContextIsAdministrator
) AS object;
