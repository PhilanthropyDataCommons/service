INSERT INTO opportunities (
	title,
	funder_short_code,
	created_by
) VALUES (
	:title,
	:funderShortCode,
	:authContextKeycloakUserId
)
RETURNING opportunity_to_json(opportunities) AS object;
