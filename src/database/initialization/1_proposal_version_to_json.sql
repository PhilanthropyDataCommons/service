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
	WITH version_field_values AS MATERIALIZED (
		SELECT proposal_field_values.*
		FROM proposal_field_values
		WHERE proposal_field_values.proposal_version_id = proposal_version.id
	)

	SELECT jsonb_agg(
		build_proposal_field_value_result(version_field_values.*)
		ORDER BY version_field_values.position, version_field_values.id DESC
	)
	INTO proposal_field_values_json
	FROM version_field_values
	INNER JOIN permitted_proposal_field_value_ids_among(
		auth_context_keycloak_user_id,
		auth_context_is_administrator,
		'view',
		'proposalFieldValue',
		ARRAY(SELECT version_field_values.id FROM version_field_values)
	) AS permitted_field_values
		ON permitted_field_values.id = version_field_values.id;

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
