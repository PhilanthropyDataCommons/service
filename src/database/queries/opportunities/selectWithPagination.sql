SELECT opportunity_to_json(opportunities.*) AS object
FROM opportunities
WHERE
	has_opportunity_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		id,
		'view',
		'opportunity'
	)
ORDER BY id
LIMIT :limit OFFSET :offset;
