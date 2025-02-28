SELECT opportunity_to_json(opportunities.*) AS object
FROM opportunities
WHERE
	has_funder_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		funder_short_code,
		'view'
	)
ORDER BY id
LIMIT :limit OFFSET :offset;
