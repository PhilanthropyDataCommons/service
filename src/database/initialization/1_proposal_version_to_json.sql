SELECT drop_function('proposal_version_to_json');

CREATE FUNCTION proposal_version_to_json(
	proposal_version proposal_versions,
	field_values jsonb,
	source jsonb
) RETURNS jsonb AS $$
	SELECT jsonb_build_object(
		'id', proposal_version.id,
		'proposalId', proposal_version.proposal_id,
		'sourceId', proposal_version.source_id,
		'source', source,
		'applicationFormId', proposal_version.application_form_id,
		'version', proposal_version.version,
		'fieldValues', COALESCE(field_values, '[]'::jsonb),
		'createdAt', proposal_version.created_at,
		'createdBy', proposal_version.created_by
	);
$$ LANGUAGE sql IMMUTABLE;
