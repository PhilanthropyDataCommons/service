INSERT INTO proposal_versions (
  proposal_id,
  application_form_id,
  source_id,
  version
) VALUES (
  :proposalId,
  :applicationFormId,
  :sourceId,
  COALESCE(
    (
      SELECT MAX(pv.version) + 1
      FROM proposal_versions as pv
      WHERE pv.proposal_id = :proposalId
    ),
    1
  )
)
RETURNING proposal_version_to_json(proposal_versions) AS "object";
