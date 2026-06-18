SELECT exists(
	SELECT 1
	FROM
		permitted_source_ids(
			:userKeycloakUserId,
			:isAdministrator,
			:permission::permission_grant_verb_t,
			:scope::permission_grant_entity_type_t
		) AS permitted_sources
	WHERE permitted_sources.id = :sourceId
) AS "hasPermission";
