SELECT opportunity_to_json(opportunities.*) AS object
FROM opportunities
WHERE
	opportunities.id = :opportunityId
	AND has_opportunity_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		opportunities.id,
		'view',
		'opportunity'
	);
