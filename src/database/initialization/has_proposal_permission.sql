CREATE OR REPLACE FUNCTION has_proposal_permission(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	proposal_id int,
	permission permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS boolean AS $$
DECLARE
	has_permission boolean;
BEGIN
	-- If the user is an administrator, they have all permissions
	IF user_is_admin THEN
		RETURN TRUE;
	END IF;

	-- Check if the user has the specified permission on the specified proposal
	-- via direct user grant, group membership, or inherited from parent entities
	SELECT EXISTS (
		-- Direct proposal grant
		SELECT 1
		FROM permission_grants pg
		WHERE pg.context_entity_type = 'proposal'
			AND pg.proposal_id = has_proposal_permission.proposal_id
			AND has_proposal_permission.permission = ANY(pg.verbs)
			AND has_proposal_permission.scope = ANY(pg.scope)
			AND (
				(
					pg.grantee_type = 'user'
					AND pg.grantee_user_keycloak_user_id
						= has_proposal_permission.user_keycloak_user_id
				)
				OR (
					pg.grantee_type = 'userGroup'
					AND EXISTS (
						SELECT 1
						FROM ephemeral_user_group_associations euga
						WHERE euga.user_keycloak_user_id
							= has_proposal_permission.user_keycloak_user_id
							AND euga.user_group_keycloak_organization_id
								= pg.grantee_keycloak_organization_id
					)
				)
			)
		UNION ALL
		-- Inherited from opportunity with proposal scope
		SELECT 1
		FROM permission_grants pg
		INNER JOIN proposals p ON pg.opportunity_id = p.opportunity_id
		WHERE pg.context_entity_type = 'opportunity'
			AND p.id = has_proposal_permission.proposal_id
			AND has_proposal_permission.permission = ANY(pg.verbs)
			AND 'proposal' = ANY(pg.scope)
			AND (
				(
					pg.grantee_type = 'user'
					AND pg.grantee_user_keycloak_user_id
						= has_proposal_permission.user_keycloak_user_id
				)
				OR (
					pg.grantee_type = 'userGroup'
					AND EXISTS (
						SELECT 1
						FROM ephemeral_user_group_associations euga
						WHERE euga.user_keycloak_user_id
							= has_proposal_permission.user_keycloak_user_id
							AND euga.user_group_keycloak_organization_id
								= pg.grantee_keycloak_organization_id
					)
				)
			)
		UNION ALL
		-- Inherited from funder with proposal scope
		SELECT 1
		FROM permission_grants pg
		INNER JOIN opportunities o ON pg.funder_short_code = o.funder_short_code
		INNER JOIN proposals p ON o.id = p.opportunity_id
		WHERE pg.context_entity_type = 'funder'
			AND p.id = has_proposal_permission.proposal_id
			AND has_proposal_permission.permission = ANY(pg.verbs)
			AND 'proposal' = ANY(pg.scope)
			AND (
				(
					pg.grantee_type = 'user'
					AND pg.grantee_user_keycloak_user_id
						= has_proposal_permission.user_keycloak_user_id
				)
				OR (
					pg.grantee_type = 'userGroup'
					AND EXISTS (
						SELECT 1
						FROM ephemeral_user_group_associations euga
						WHERE euga.user_keycloak_user_id
							= has_proposal_permission.user_keycloak_user_id
							AND euga.user_group_keycloak_organization_id
								= pg.grantee_keycloak_organization_id
					)
				)
			)
		UNION ALL
		-- Inherited from changemaker with proposal scope
		SELECT 1
		FROM permission_grants pg
		INNER JOIN changemakers_proposals cp ON pg.changemaker_id = cp.changemaker_id
		WHERE pg.context_entity_type = 'changemaker'
			AND cp.proposal_id = has_proposal_permission.proposal_id
			AND has_proposal_permission.permission = ANY(pg.verbs)
			AND 'proposal' = ANY(pg.scope)
			AND (
				(
					pg.grantee_type = 'user'
					AND pg.grantee_user_keycloak_user_id
						= has_proposal_permission.user_keycloak_user_id
				)
				OR (
					pg.grantee_type = 'userGroup'
					AND EXISTS (
						SELECT 1
						FROM ephemeral_user_group_associations euga
						WHERE euga.user_keycloak_user_id
							= has_proposal_permission.user_keycloak_user_id
							AND euga.user_group_keycloak_organization_id
								= pg.grantee_keycloak_organization_id
					)
				)
			)
	) INTO has_permission;

	RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
