SELECT has_application_form_field_permission(
	:userKeycloakUserId,
	:isAdministrator,
	:applicationFormFieldId,
	:permission::permission_grant_verb_t,
	:scope::permission_grant_entity_type_t
) AS "hasPermission";
