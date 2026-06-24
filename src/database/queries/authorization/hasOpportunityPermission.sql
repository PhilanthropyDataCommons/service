SELECT exists(
	SELECT 1
	FROM
		permitted_opportunity_ids(
			:userKeycloakUserId,
			:isAdministrator,
			:permission::permission_grant_verb_t,
			:scope::permission_grant_entity_type_t
		) AS permitted_opportunities
	WHERE permitted_opportunities.id = :opportunityId
) AS "hasPermission";
