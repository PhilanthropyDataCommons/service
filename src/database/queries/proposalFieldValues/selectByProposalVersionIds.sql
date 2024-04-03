SELECT id,
  proposal_version_id AS "proposalVersionId",
  application_form_field_id AS "applicationFormFieldId",
  value,
  position,
  is_valid AS "isValid",
  created_at AS "createdAt"
FROM proposal_field_values
WHERE proposal_version_id = ANY(:proposalVersionIds)
ORDER BY position;
