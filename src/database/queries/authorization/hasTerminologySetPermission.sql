SELECT exists(
	SELECT 1
	FROM
		permitted_terminology_set_ids(
			:userKeycloakUserId,
			:isAdministrator,
			:permission::permission_grant_verb_t,
			:scope::permission_grant_entity_type_t
		) AS permitted_terminology_sets
	WHERE permitted_terminology_sets.id = :terminologySetId
) AS "hasPermission";
