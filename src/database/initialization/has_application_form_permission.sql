SELECT drop_function('has_application_form_permission');

CREATE FUNCTION has_application_form_permission(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	application_form_id int,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS boolean AS $$
DECLARE
	has_permission boolean;
BEGIN
	-- If the user is an administrator, they have all permissions
	IF user_is_admin THEN
		RETURN TRUE;
	END IF;

	-- Check if the user has the specified verb on the specified application
	-- form via direct user grant, group membership, or inherited from
	-- opportunity or funder.
	SELECT EXISTS (
		SELECT 1
		FROM application_forms af
		INNER JOIN opportunities o ON af.opportunity_id = o.id
		INNER JOIN permission_grants pg ON (
			-- Direct application form grant
			(
				pg.context_entity_type = 'applicationForm'
				AND pg.application_form_id = af.id
			)
			-- Inherited from opportunity
			OR (
				pg.context_entity_type = 'opportunity'
				AND pg.opportunity_id = af.opportunity_id
			)
			-- Inherited from funder
			OR (
				pg.context_entity_type = 'funder'
				AND pg.funder_short_code = o.funder_short_code
			)
		)
		WHERE af.id = has_application_form_permission.application_form_id
			AND verb_set_permits_verb(
				pg.verbs, has_application_form_permission.verb
			)
			AND scope_set_permits_scope(
				pg.scope, has_application_form_permission.scope
			)
			AND (
				pg.grantee_type = 'authenticatedUsers'
				OR (
					pg.grantee_type = 'user'
					AND pg.grantee_user_keycloak_user_id
						= has_application_form_permission.user_keycloak_user_id
				)
				OR (
					pg.grantee_type = 'userGroup'
					AND EXISTS (
						SELECT 1
						FROM ephemeral_user_group_associations euga
						WHERE euga.user_keycloak_user_id
							= has_application_form_permission.user_keycloak_user_id
							AND euga.user_group_keycloak_organization_id
								= pg.grantee_keycloak_organization_id
							AND NOT is_expired(euga.not_after)
					)
				)
			)
	) INTO has_permission;

	RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
