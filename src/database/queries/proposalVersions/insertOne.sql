INSERT INTO proposal_versions (
  proposal_id,
  application_form_id,
  version
) VALUES (
  :proposalId,
  :applicationFormId,
  COALESCE(
    (
      SELECT MAX(pv.version) + 1
      FROM proposal_versions as pv
      WHERE pv.proposal_id = :proposalId
    ),
    1
  )
)
RETURNING
  id as "id",
  proposal_id as "proposalId",
  application_form_id as "applicationFormId",
  version as "version",
  created_at AS "createdAt"
