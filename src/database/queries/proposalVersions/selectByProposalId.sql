SELECT pv.id AS "id",
  pv.proposal_id AS "proposalId",
  pv.application_form_id AS "applicationFormId",
  pv.version AS "version",
  pv.created_at AS "createdAt"
FROM proposal_versions pv
WHERE pv.proposal_id = :proposalId
ORDER BY pv.version DESC;
