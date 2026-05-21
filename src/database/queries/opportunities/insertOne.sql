INSERT INTO opportunities (
	title,
	funder_short_code,
	terminology_set_id,
	created_by
) VALUES (
	:title,
	:funderShortCode::short_code_t,
	coalesce(
		:terminologySetId::int,
		(
			SELECT funders.default_terminology_set_id
			FROM funders
			WHERE funders.short_code = :funderShortCode::short_code_t
		)
	),
	:authContextKeycloakUserId
)
RETURNING opportunity_to_json(opportunities) AS object;
