CREATE OR REPLACE FUNCTION has_application_form_field_permission(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	application_form_field_id int,
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

	-- Check if the user has the specified permission on the specified application
	-- form field via direct user grant, group membership, or inherited from parent
	-- entities (application form, opportunity, or funder).
	SELECT EXISTS (
		SELECT 1
		FROM application_form_fields aff
		INNER JOIN application_forms af ON aff.application_form_id = af.id
		INNER JOIN opportunities o ON af.opportunity_id = o.id
		INNER JOIN permission_grants pg ON (
			-- Direct applicationFormField grant
			(
				pg.context_entity_type = 'applicationFormField'
				AND pg.application_form_field_id = aff.id
				AND has_application_form_field_permission.scope = ANY(pg.scope)
			)
			-- Inherited from applicationForm with applicationFormField scope
			OR (
				pg.context_entity_type = 'applicationForm'
				AND pg.application_form_id = af.id
				AND 'applicationFormField' = ANY(pg.scope)
			)
			-- Inherited from opportunity with applicationFormField scope
			OR (
				pg.context_entity_type = 'opportunity'
				AND pg.opportunity_id = o.id
				AND 'applicationFormField' = ANY(pg.scope)
			)
			-- Inherited from funder with applicationFormField scope
			OR (
				pg.context_entity_type = 'funder'
				AND pg.funder_short_code = o.funder_short_code
				AND 'applicationFormField' = ANY(pg.scope)
			)
		)
		WHERE
			aff.id
				= has_application_form_field_permission.application_form_field_id
			AND has_application_form_field_permission.permission = ANY(pg.verbs)
			AND (
				(
					pg.grantee_type = 'user'
					AND pg.grantee_user_keycloak_user_id
						= has_application_form_field_permission.user_keycloak_user_id
				)
				OR (
					pg.grantee_type = 'userGroup'
					AND EXISTS (
						SELECT 1
						FROM ephemeral_user_group_associations euga
						WHERE euga.user_keycloak_user_id
							= has_application_form_field_permission.user_keycloak_user_id
							AND euga.user_group_keycloak_organization_id
								= pg.grantee_keycloak_organization_id
							AND NOT is_expired(euga.not_after)
					)
				)
			)
	) INTO has_permission;

	RETURN has_permission;
END;
$$ LANGUAGE plpgsql STABLE;
