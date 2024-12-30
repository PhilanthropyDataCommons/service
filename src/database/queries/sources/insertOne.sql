INSERT INTO sources (
	label,
	data_provider_short_code,
	funder_short_code,
	changemaker_id
)
VALUES (
	:label,
	:dataProviderShortCode,
	:funderShortCode,
	:changemakerId
)
RETURNING source_to_json(sources) AS object;
