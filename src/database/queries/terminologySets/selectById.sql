SELECT terminology_set_to_json(terminology_sets.*) AS object
FROM terminology_sets
	INNER JOIN
		permitted_terminology_set_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'terminologySet'
		) AS permitted_terminology_sets
		ON terminology_sets.id = permitted_terminology_sets.id
WHERE terminology_sets.id = :terminologySetId;
