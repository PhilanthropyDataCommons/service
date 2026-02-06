SELECT opportunity_to_json(opportunities.*) AS object
FROM opportunities
WHERE
	has_funder_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		funder_short_code,
		'view',
		'funder'
	)
	OR has_opportunity_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		id,
		'view'
	)
ORDER BY id
LIMIT :limit OFFSET :offset;
