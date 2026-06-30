SELECT drop_function('proposal_to_json');

CREATE FUNCTION proposal_to_json(
	proposal proposals,
	opportunity jsonb,
	versions jsonb,
	changemakers jsonb
) RETURNS jsonb AS $$
	SELECT jsonb_build_object(
		'id', proposal.id,
		'opportunityId', proposal.opportunity_id,
		'opportunity', opportunity,
		'externalId', proposal.external_id,
		'versions', COALESCE(versions, '[]'::jsonb),
		'changemakers', COALESCE(changemakers, '[]'::jsonb),
		'createdAt', proposal.created_at,
		'createdBy', proposal.created_by
	);
$$ LANGUAGE sql IMMUTABLE;
