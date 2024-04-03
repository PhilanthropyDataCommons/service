SELECT pfv.id AS "id",
  pfv.proposal_version_id AS "proposalVersionId",
  pfv.application_form_field_id AS "applicationFormFieldId",
  pfv.value AS "value",
  pfv.position AS "position",
  pfv.is_valid AS "isValid",
  pfv.created_at AS "createdAt"
FROM proposal_field_values pfv
INNER JOIN proposal_versions pv
  ON pv.id = pfv.proposal_version_id
WHERE pv.proposal_id = :proposalId
ORDER BY pv.version DESC, pfv.position, pfv.id;
