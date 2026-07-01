SELECT drop_function('changemaker_proposal_to_json');

CREATE FUNCTION changemaker_proposal_to_json(
	changemaker_proposal changemakers_proposals,
	changemaker jsonb,
	proposal jsonb
) RETURNS jsonb AS $$
	SELECT jsonb_build_object(
		'id', changemaker_proposal.id,
		'changemakerId', changemaker_proposal.changemaker_id,
		'changemaker', changemaker,
		'proposalId', changemaker_proposal.proposal_id,
		'proposal', proposal,
		'createdAt', changemaker_proposal.created_at
	);
$$ LANGUAGE sql IMMUTABLE;
