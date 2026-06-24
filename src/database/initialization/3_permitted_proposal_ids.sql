SELECT drop_function('permitted_proposal_ids');

-- Returns the ids of proposals on which the user holds `verb` at `scope`.
CREATE FUNCTION permitted_proposal_ids(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS TABLE (id int) AS $$
	-- Administrators have all permissions.
	SELECT proposals.id
	FROM proposals
	WHERE permitted_proposal_ids.user_is_admin

	UNION

	-- Granted directly on the proposal.
	SELECT pg.proposal_id
	FROM permission_grants pg
	WHERE pg.context_entity_type = 'proposal'
		AND verb_set_permits_verb(pg.verbs, permitted_proposal_ids.verb)
		AND scope_set_permits_scope(pg.scope, permitted_proposal_ids.scope)
		AND grantee_permits_user(
			pg.grantee_type,
			pg.grantee_user_keycloak_user_id,
			pg.grantee_keycloak_organization_id,
			permitted_proposal_ids.user_keycloak_user_id
		)

	UNION

	-- Inherited from the proposal's opportunity (directly or via its funder).
	SELECT proposals.id
	FROM proposals
	INNER JOIN permitted_opportunity_ids(
		permitted_proposal_ids.user_keycloak_user_id,
		permitted_proposal_ids.user_is_admin,
		permitted_proposal_ids.verb,
		permitted_proposal_ids.scope
	) AS permitted_opportunities
		ON proposals.opportunity_id = permitted_opportunities.id

	UNION

	-- Inherited from the proposal's changemakers.
	SELECT cp.proposal_id
	FROM changemakers_proposals cp
	INNER JOIN permitted_changemaker_ids(
		permitted_proposal_ids.user_keycloak_user_id,
		permitted_proposal_ids.user_is_admin,
		permitted_proposal_ids.verb,
		permitted_proposal_ids.scope
	) AS permitted_changemakers
		ON cp.changemaker_id = permitted_changemakers.id;
$$ LANGUAGE sql STABLE;
