SELECT drop_function('changemaker_proposal_to_json');

CREATE FUNCTION changemaker_proposal_to_json(
  changemaker_proposal changemakers_proposals
)
RETURNS jsonb AS $$
DECLARE
  proposal_json JSONB;
  changemaker_json JSONB;
BEGIN
  SELECT proposal_to_json(proposals.*)
  INTO proposal_json
  FROM proposals
  WHERE proposals.id = changemaker_proposal.proposal_id;

  SELECT changemaker_to_json(changemakers.*)
  INTO changemaker_json
  FROM changemakers
  WHERE changemakers.id = changemaker_proposal.changemaker_id;

  RETURN jsonb_build_object(
    'id', changemaker_proposal.id,
    'changemakerId', changemaker_proposal.changemaker_id,
    'changemaker', changemaker_json,
    'proposalId', changemaker_proposal.proposal_id,
    'proposal', proposal_json,
    'createdAt', changemaker_proposal.created_at
  );
END;
$$ LANGUAGE plpgsql;
