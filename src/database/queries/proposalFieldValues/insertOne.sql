INSERT INTO proposal_field_values (
  proposal_version_id,
  application_form_field_id,
  value,
  position
) VALUES (
  :proposalVersionId,
  :applicationFormFieldId,
  :value,
  :position
)
RETURNING
  id as "id",
  proposal_version_id as "proposalVersionId",
  application_form_field_id as "applicationFormFieldId",
  value as "value",
  position as "position",
  created_at AS "createdAt"
