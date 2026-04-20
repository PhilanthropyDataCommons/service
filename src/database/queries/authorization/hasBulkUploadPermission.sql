SELECT has_bulk_upload_permission(
	:userKeycloakUserId,
	:isAdministrator,
	:bulkUploadTaskId,
	:permission::permission_grant_verb_t,
	:scope::permission_grant_entity_type_t
) AS "hasPermission";
