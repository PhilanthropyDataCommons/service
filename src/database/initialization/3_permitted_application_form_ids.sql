SELECT drop_function('permitted_application_form_ids');

-- Returns the ids of application forms on which the user holds `verb` at
-- `scope`.
CREATE FUNCTION permitted_application_form_ids(
	auth_context_id text,
	user_is_admin boolean,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS TABLE (id int) AS $$
	-- Administrators have all permissions.
	SELECT application_forms.id
	FROM application_forms
	WHERE permitted_application_form_ids.user_is_admin

	UNION

	-- Granted directly on the application form.
	SELECT pg.application_form_id
	FROM permission_grants pg
	WHERE pg.context_entity_type = 'applicationForm'
		AND verb_set_permits_verb(
			pg.verbs, permitted_application_form_ids.verb
		)
		AND scope_set_permits_scope(
			pg.scope, permitted_application_form_ids.scope
		)
		AND grantee_permits_auth_context(
			pg.grantee_type,
			pg.grantee_user_keycloak_user_id,
			pg.grantee_keycloak_organization_id,
			permitted_application_form_ids.auth_context_id
		)

	UNION

	-- Inherited from the application form's opportunity (directly or via its
	-- funder).
	SELECT application_forms.id
	FROM application_forms
	INNER JOIN permitted_opportunity_ids(
		permitted_application_form_ids.auth_context_id,
		permitted_application_form_ids.user_is_admin,
		permitted_application_form_ids.verb,
		permitted_application_form_ids.scope
	) AS permitted_opportunities
		ON application_forms.opportunity_id = permitted_opportunities.id;
$$ LANGUAGE sql STABLE;
