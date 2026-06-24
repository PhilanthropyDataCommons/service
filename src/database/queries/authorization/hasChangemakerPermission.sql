SELECT exists(
	SELECT 1
	FROM
		permitted_changemaker_ids(
			:userKeycloakUserId,
			:isAdministrator,
			:permission::permission_grant_verb_t,
			:scope::permission_grant_entity_type_t
		) AS permitted_changemakers
	WHERE permitted_changemakers.id = :changemakerId
) AS "hasPermission";
