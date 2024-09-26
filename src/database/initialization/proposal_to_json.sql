SELECT drop_function('proposal_to_json');

CREATE FUNCTION proposal_to_json(proposal proposals)
RETURNS JSONB AS $$
DECLARE
  proposal_versions_json JSONB;
BEGIN
  SELECT jsonb_agg(
    proposal_version_to_json(proposal_versions.*)
    ORDER BY proposal_versions.version DESC, proposal_versions.id DESC
  )
  INTO proposal_versions_json
  FROM proposal_versions
  WHERE proposal_versions.proposal_id = proposal.id;

  RETURN jsonb_build_object(
    'id', proposal.id,
    'opportunityId', proposal.opportunity_id,
    'externalId', proposal.external_id,
    'versions', COALESCE(proposal_versions_json, '[]'::JSONB),
    'createdAt', proposal.created_at,
    'createdBy', proposal.created_by
  );
END;
$$ LANGUAGE plpgsql;
