INSERT INTO proposal_field_values (
  proposal_version_id,
  application_form_field_id,
  value,
  sequence
) VALUES (
  :proposalVersionId,
  :applicationFormFieldId,
  :value,
  :sequence
)
RETURNING
  id as "id",
  proposal_version_id as "proposalVersionId",
  application_form_field_id as "applicationFormFieldId",
  value as "value",
  sequence as "sequence",
  created_at AS "createdAt"
