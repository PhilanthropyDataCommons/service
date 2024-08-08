INSERT INTO sources (
  source_type,
  label,
  data_provider_id,
  funder_id,
  organization_id
)
VALUES (
  :sourceType,
  :label,
  CASE
    WHEN :sourceType = 'data_provider'::source_type THEN CAST(:relatedEntityId AS INTEGER)
    ELSE NULL
  END,
  CASE
    WHEN :sourceType = 'funder'::source_type THEN CAST(:relatedEntityId AS INTEGER)
    ELSE NULL
  END,
  CASE
    WHEN :sourceType = 'organization'::source_type THEN CAST(:relatedEntityId AS INTEGER)
    ELSE NULL
  END
)
RETURNING source_to_json(sources) AS "object";
