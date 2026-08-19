SELECT exists(
	SELECT 1
	FROM
		permitted_initiative_ids(
			:userKeycloakUserId,
			:isAdministrator,
			:permission::permission_grant_verb_t,
			:scope::permission_grant_entity_type_t
		) AS permitted_initiatives
	WHERE permitted_initiatives.id = :initiativeId
) AS "hasPermission";
