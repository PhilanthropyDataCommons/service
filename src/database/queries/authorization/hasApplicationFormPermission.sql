SELECT exists(
	SELECT 1
	FROM
		permitted_application_form_ids(
			:userKeycloakUserId,
			:isAdministrator,
			:permission::permission_grant_verb_t,
			:scope::permission_grant_entity_type_t
		) AS permitted_application_forms
	WHERE permitted_application_forms.id = :applicationFormId
) AS "hasPermission";
