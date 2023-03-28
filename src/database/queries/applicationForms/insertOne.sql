INSERT INTO application_forms (
  opportunity_id,
  version,
  external_id
) VALUES (
  :opportunityId,
  COALESCE(
    (
      SELECT MAX(af.version) + 1
      FROM application_forms as af
      WHERE af.opportunity_id = :opportunityId
    ),
    1
  ),
  :externalId
)
RETURNING
  id as "id",
  opportunity_id as "opportunityId",
  version as "version",
  external_id as "externalId",
  created_at as "createdAt"
