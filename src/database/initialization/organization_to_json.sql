CREATE OR REPLACE FUNCTION organization_to_json(organization organizations)
RETURNS JSONB AS $$
DECLARE
  proposals_json JSONB;
BEGIN
  SELECT jsonb_agg(
    proposal_to_json(proposals.*)
    ORDER BY proposals.id DESC
  )
  INTO proposals_json
  FROM proposals
  JOIN organizations_proposals ON organizations_proposals.proposal_id = proposal.id
  WHERE organizations_proposals.organization_id = organization.id;

  RETURN jsonb_build_object(
    'id', organization.id,
    'employerIdentificationNumber', organization.employer_identification_number,
    'name', organization.name,
    'proposals', COALESCE(proposals_json, '[]'::JSONB),
    'createdAt', organization.created_at
  );
END;
$$ LANGUAGE plpgsql;
