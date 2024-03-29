SELECT aff.id AS "id",
  aff.application_form_id AS "applicationFormId",
  aff.base_field_id AS "baseFieldId",
  aff.position AS "position",
  aff.label AS "label",
  aff.created_at AS "createdAt"
FROM application_form_fields aff
INNER JOIN proposal_field_values pfv
  ON pfv.application_form_field_id = aff.id
INNER JOIN proposal_versions pv
  ON pv.id = pfv.proposal_version_id
WHERE pv.proposal_id = :proposalId
ORDER BY pv.version DESC, pfv.position, pfv.id;
