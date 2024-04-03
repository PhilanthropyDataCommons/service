INSERT INTO proposal_field_values (
  proposal_version_id,
  application_form_field_id,
  value,
  position,
  is_valid
) VALUES (
  :proposalVersionId,
  :applicationFormFieldId,
  :value,
  :position,
  :isValid
)
RETURNING
  id as "id",
  proposal_version_id as "proposalVersionId",
  application_form_field_id as "applicationFormFieldId",
  value as "value",
  position as "position",
  is_valid as "isValid",
  created_at AS "createdAt"
