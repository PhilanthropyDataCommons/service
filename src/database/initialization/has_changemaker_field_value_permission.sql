CREATE OR REPLACE FUNCTION has_changemaker_field_value_permission(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	changemaker_field_value_id int,
	permission permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS boolean AS $$
DECLARE
	has_permission boolean;
	sensitivity sensitivity_classification;
BEGIN
	-- Look up the sensitivity classification for the associated base field
	SELECT bf.sensitivity_classification
	INTO sensitivity
	FROM changemaker_field_values cfv
	INNER JOIN base_fields bf ON cfv.base_field_short_code = bf.short_code
	WHERE cfv.id = has_changemaker_field_value_permission.changemaker_field_value_id;

	-- Forbidden fields are never viewable by anyone
	IF sensitivity = 'forbidden' THEN
		RETURN FALSE;
	END IF;

	-- Public fields are viewable by any authenticated user
	IF sensitivity = 'public' AND permission = 'view' THEN
		RETURN TRUE;
	END IF;

	-- If the user is an administrator, they have all permissions
	IF user_is_admin THEN
		RETURN TRUE;
	END IF;

	-- Check if the user has the specified permission on the specified changemaker field value
	-- via direct user grant, group membership, or inherited from parent entities
	SELECT EXISTS (
		SELECT 1
		FROM changemaker_field_values cfv
		INNER JOIN permission_grants pg ON (
			-- Direct changemakerFieldValue grant
			(
				pg.context_entity_type = 'changemakerFieldValue'
				AND pg.changemaker_field_value_id = cfv.id
				AND has_changemaker_field_value_permission.scope = ANY(pg.scope)
			)
			-- Inherited from changemaker with changemakerFieldValue scope
			OR (
				pg.context_entity_type = 'changemaker'
				AND pg.changemaker_id = cfv.changemaker_id
				AND 'changemakerFieldValue' = ANY(pg.scope)
			)
		)
		WHERE cfv.id = has_changemaker_field_value_permission.changemaker_field_value_id
			AND has_changemaker_field_value_permission.permission = ANY(pg.verbs)
			AND (
				(
					pg.grantee_type = 'user'
					AND pg.grantee_user_keycloak_user_id
						= has_changemaker_field_value_permission.user_keycloak_user_id
				)
				OR (
					pg.grantee_type = 'userGroup'
					AND EXISTS (
						SELECT 1
						FROM ephemeral_user_group_associations euga
						WHERE euga.user_keycloak_user_id
							= has_changemaker_field_value_permission.user_keycloak_user_id
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
