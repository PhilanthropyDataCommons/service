SELECT drop_function('build_proposal_version_result');

-- Gathers a single proposal version's children (its viewable field values and
-- its source) and assembles the result with the proposal_version_to_json shape.
-- For the single-row endpoints; the proposals read path gathers versions in
-- bulk instead.
CREATE FUNCTION build_proposal_version_result(
	proposal_version proposal_versions,
	auth_context_keycloak_user_id uuid DEFAULT NULL,
	auth_context_is_administrator boolean DEFAULT FALSE
) RETURNS jsonb AS $$
DECLARE
	field_values_json JSONB;
	source_json JSONB;
BEGIN
	SELECT jsonb_agg(
		build_proposal_field_value_result(proposal_field_values)
		ORDER BY proposal_field_values.position, proposal_field_values.id DESC
	)
	INTO field_values_json
	FROM proposal_field_values
	INNER JOIN permitted_proposal_field_value_ids_among(
		auth_context_keycloak_user_id,
		auth_context_is_administrator,
		'view',
		'proposalFieldValue',
		ARRAY(
			SELECT id
			FROM proposal_field_values
			WHERE proposal_field_values.proposal_version_id = proposal_version.id
		)
	) AS permitted_field_values
		ON permitted_field_values.id = proposal_field_values.id
	WHERE proposal_field_values.proposal_version_id = proposal_version.id;

	SELECT source_to_json(
		sources.*,
		auth_context_keycloak_user_id,
		auth_context_is_administrator
	)
	INTO source_json
	FROM sources
	WHERE sources.id = proposal_version.source_id;

	RETURN proposal_version_to_json(
		proposal_version,
		field_values_json,
		source_json
	);
END;
$$ LANGUAGE plpgsql STABLE;
