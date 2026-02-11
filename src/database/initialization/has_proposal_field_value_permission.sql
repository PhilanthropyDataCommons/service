CREATE OR REPLACE FUNCTION has_proposal_field_value_permission(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	proposal_field_value_id int,
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

	-- Check if the user has the specified permission on the specified proposal field value
	-- via direct user grant, group membership, or inherited from parent entities
	SELECT EXISTS (
		SELECT 1
		FROM proposal_field_values pfv
		INNER JOIN proposal_versions pv ON pfv.proposal_version_id = pv.id
		INNER JOIN proposals p ON pv.proposal_id = p.id
		INNER JOIN opportunities o ON p.opportunity_id = o.id
		LEFT JOIN changemakers_proposals cp ON p.id = cp.proposal_id
		INNER JOIN permission_grants pg ON (
			-- Direct proposalFieldValue grant
			(
				pg.context_entity_type = 'proposalFieldValue'
				AND pg.proposal_field_value_id = pfv.id
				AND has_proposal_field_value_permission.scope = ANY(pg.scope)
			)
			-- Inherited from proposal with proposalFieldValue scope
			OR (
				pg.context_entity_type = 'proposal'
				AND pg.proposal_id = pv.proposal_id
				AND 'proposalFieldValue' = ANY(pg.scope)
			)
			-- Inherited from opportunity with proposalFieldValue scope
			OR (
				pg.context_entity_type = 'opportunity'
				AND pg.opportunity_id = p.opportunity_id
				AND 'proposalFieldValue' = ANY(pg.scope)
			)
			-- Inherited from funder with proposalFieldValue scope
			OR (
				pg.context_entity_type = 'funder'
				AND pg.funder_short_code = o.funder_short_code
				AND 'proposalFieldValue' = ANY(pg.scope)
			)
			-- Inherited from changemaker with proposalFieldValue scope
			OR (
				pg.context_entity_type = 'changemaker'
				AND pg.changemaker_id = cp.changemaker_id
				AND 'proposalFieldValue' = ANY(pg.scope)
			)
		)
		WHERE pfv.id = has_proposal_field_value_permission.proposal_field_value_id
			AND has_proposal_field_value_permission.permission = ANY(pg.verbs)
			AND (
				(
					pg.grantee_type = 'user'
					AND pg.grantee_user_keycloak_user_id
						= has_proposal_field_value_permission.user_keycloak_user_id
				)
				OR (
					pg.grantee_type = 'userGroup'
					AND EXISTS (
						SELECT 1
						FROM ephemeral_user_group_associations euga
						WHERE euga.user_keycloak_user_id
							= has_proposal_field_value_permission.user_keycloak_user_id
							AND euga.user_group_keycloak_organization_id
								= pg.grantee_keycloak_organization_id
					)
				)
			)
	) INTO has_permission;

	RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
