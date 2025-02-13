INSERT INTO opportunities (
	title,
	funder_short_code
) VALUES (
	:title,
	:funderShortCode
)
RETURNING opportunity_to_json(opportunities) AS object;
