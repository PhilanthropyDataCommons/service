SELECT id,
  proposal_id AS "proposalId",
  application_form_id AS "applicationFormId",
  version,
  created_at AS "createdAt"
FROM proposal_versions
WHERE proposal_id = ANY(:proposalIds)
ORDER BY version, id DESC;
