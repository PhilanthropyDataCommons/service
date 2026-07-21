SELECT drop_function('build_proposal_field_value_result');

-- Gathers a single proposal field value's children (application form field,
-- file) and assembles the result with the proposal_field_value_to_json shape.
-- For the single-row endpoints; the proposals read path gathers field values in
-- bulk instead. Guards against forbidden fields, since callers may serialize a
-- row that has not been permission-filtered (the field value insert).
CREATE FUNCTION build_proposal_field_value_result(
	proposal_field_value proposal_field_values
) RETURNS jsonb AS $$
DECLARE
	is_file_field BOOLEAN;
	application_form_field_json JSONB;
	version_created_by UUID;
	version_proposal_id INTEGER;
BEGIN
	PERFORM assert_proposal_field_value_not_forbidden(proposal_field_value);

	SELECT
		base_fields.data_type = 'file',
		application_form_field_to_json(application_form_fields.*)
	INTO is_file_field, application_form_field_json
	FROM application_form_fields
	INNER JOIN base_fields
		ON base_fields.short_code = application_form_fields.base_field_short_code
	WHERE application_form_fields.id
		= proposal_field_value.application_form_field_id;

	SELECT proposal_versions.created_by, proposal_versions.proposal_id
	INTO version_created_by, version_proposal_id
	FROM proposal_versions
	WHERE proposal_versions.id = proposal_field_value.proposal_version_id;

	RETURN proposal_field_value_to_json(
		proposal_field_value,
		application_form_field_json,
		proposal_field_value_file_to_json(
			proposal_field_value, is_file_field, version_created_by
		),
		version_proposal_id
	);
END;
$$ LANGUAGE plpgsql STABLE;
