SELECT exists(
	SELECT 1
	FROM
		permitted_changemaker_field_value_ids(
			:userKeycloakUserId,
			:isAdministrator,
			:permission::permission_grant_verb_t,
			:scope::permission_grant_entity_type_t
		) AS permitted_field_values
	WHERE permitted_field_values.id = :changemakerFieldValueId
) AS "hasPermission";
