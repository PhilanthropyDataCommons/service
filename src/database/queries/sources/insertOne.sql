INSERT INTO sources (
  label,
  data_provider_short_code,
  funder_short_code,
  organization_id
)
VALUES (
  :label,
  :dataProviderShortCode,
  :funderShortCode,
  :organizationId
)
RETURNING source_to_json(sources) AS "object";
