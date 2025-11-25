UPDATE application_form_fields
SET
	label = update_if(:labelWasProvided, :label, label),
	instructions = update_if(:instructionsWasProvided, :instructions, instructions)
WHERE id = :applicationFormFieldId
RETURNING application_form_field_to_json(application_form_fields) AS object;
