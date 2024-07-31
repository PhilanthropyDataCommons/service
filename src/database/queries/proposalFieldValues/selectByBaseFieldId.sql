SELECT proposal_field_value_to_json(pfv.*) as "object"
FROM proposal_field_values pfv
INNER JOIN application_form_fields aff
  ON pfv.application_form_field_id = aff.id
WHERE aff.base_field_id = :baseFieldId;
