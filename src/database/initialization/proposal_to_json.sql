SELECT drop_function('proposal_to_json');

CREATE FUNCTION proposal_to_json(
	proposal proposals,
	auth_context_keycloak_user_id uuid DEFAULT NULL,
	auth_context_is_administrator boolean DEFAULT FALSE
)
RETURNS jsonb AS $$
DECLARE
  proposal_versions_json JSONB;
  opportunity_json JSONB;
BEGIN
  SELECT jsonb_agg(
    proposal_version_to_json(
      proposal_versions.*,
      auth_context_keycloak_user_id,
      auth_context_is_administrator
    )
    ORDER BY proposal_versions.version DESC, proposal_versions.id DESC
  )
  INTO proposal_versions_json
  FROM proposal_versions
  WHERE proposal_versions.proposal_id = proposal.id;

  SELECT opportunity_to_json(opportunities.*)
  INTO opportunity_json
  FROM opportunities
  WHERE opportunities.id = proposal.opportunity_id;

  RETURN jsonb_build_object(
    'id', proposal.id,
    'opportunityId', proposal.opportunity_id,
    'opportunity', opportunity_json,
    'externalId', proposal.external_id,
    'versions', COALESCE(proposal_versions_json, '[]'::JSONB),
    'createdAt', proposal.created_at,
    'createdBy', proposal.created_by
  );
END;
$$ LANGUAGE plpgsql;
