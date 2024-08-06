SELECT proposal_field_value_to_json(pfv.*) as "object"
FROM proposal_field_values pfv
INNER JOIN application_form_fields aff
  ON pfv.application_form_field_id = aff.id
INNER JOIN proposal_versions pv
  ON pfv.proposal_version_id = pv.id
INNER JOIN organizations_proposals op
  ON pv.proposal_id = op.proposal_id
WHERE aff.base_field_id = :baseFieldId
  AND op.organization_id = :organizationId
