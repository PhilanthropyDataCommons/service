CREATE OR REPLACE FUNCTION organization_proposal_to_json(organization_proposal organizations_proposals)
RETURNS JSONB AS $$
DECLARE
  proposal_json JSONB;
  organization_json JSONB;
BEGIN
  SELECT proposal_to_json(proposals.*)
  INTO proposal_json
  FROM proposals
  WHERE proposals.id = organization_proposal.proposal_id;

  SELECT organization_to_json(organizations.*)
  INTO organization_json
  FROM organizations
  WHERE organizations.id = organization_proposal.organization_id;

  RETURN jsonb_build_object(
    'id', organization_proposal.id,
    'organizationId', organization_proposal.organization_id,
    'organization', organization_json,
    'proposalId', organization_proposal.proposal_id,
    'proposal', proposal_json,
    'createdAt', organization_proposal.created_at
  );
END;
$$ LANGUAGE plpgsql;
