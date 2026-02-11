SELECT drop_function('proposal_version_to_json');

CREATE FUNCTION proposal_version_to_json(
	proposal_version proposal_versions,
	auth_context_keycloak_user_id uuid DEFAULT NULL,
	auth_context_is_administrator boolean DEFAULT FALSE
)
RETURNS jsonb AS $$
DECLARE
	proposal_field_values_json JSONB;
	source_json JSONB;
BEGIN
	SELECT jsonb_agg(
		proposal_field_value_to_json(proposal_field_values.*)
		ORDER BY proposal_field_values.position, proposal_field_values.id DESC
	)
	INTO proposal_field_values_json
	FROM proposal_field_values
	INNER JOIN application_form_fields
		ON proposal_field_values.application_form_field_id = application_form_fields.id
	INNER JOIN base_fields
		ON application_form_fields.base_field_short_code = base_fields.short_code
	WHERE proposal_field_values.proposal_version_id = proposal_version.id
		AND base_fields.sensitivity_classification != 'forbidden'
		AND (
			auth_context_is_administrator
			OR has_proposal_field_value_permission(
				auth_context_keycloak_user_id,
				auth_context_is_administrator,
				proposal_field_values.id,
				'view',
				'proposalFieldValue'
			)
		);

	SELECT source_to_json(
		sources.*,
		auth_context_keycloak_user_id,
		auth_context_is_administrator
	)
	INTO source_json
	FROM sources
	WHERE sources.id = proposal_version.source_id;

	RETURN jsonb_build_object(
		'id', proposal_version.id,
		'proposalId', proposal_version.proposal_id,
		'sourceId', proposal_version.source_id,
		'source', source_json,
		'applicationFormId', proposal_version.application_form_id,
		'version', proposal_version.version,
		'fieldValues', COALESCE(proposal_field_values_json, '[]'::JSONB),
		'createdAt', proposal_version.created_at,
		'createdBy', proposal_version.created_by
	);
END;
$$ LANGUAGE plpgsql;
