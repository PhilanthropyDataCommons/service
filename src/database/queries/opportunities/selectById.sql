SELECT
	opportunity_to_json(
		opportunities.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM opportunities
	INNER JOIN
		permitted_opportunity_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'opportunity'
		) AS permitted_opportunities
		ON opportunities.id = permitted_opportunities.id
WHERE opportunities.id = :opportunityId;
