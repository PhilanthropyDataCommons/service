SELECT opportunity_to_json(opportunities.*) AS object
FROM opportunities
WHERE
	opportunities.id = :opportunityId
	AND (
		has_funder_permission(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			opportunities.funder_short_code,
			'view',
			'funder'
		)
		OR has_opportunity_permission(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			opportunities.id,
			'view',
			'opportunity'
		)
	);
