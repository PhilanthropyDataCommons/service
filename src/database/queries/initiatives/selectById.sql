SELECT initiative_to_json(initiatives.*) AS object
FROM initiatives
	INNER JOIN
		permitted_initiative_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'initiative'
		) AS permitted_initiatives
		ON initiatives.id = permitted_initiatives.id
WHERE initiatives.id = :initiativeId;
