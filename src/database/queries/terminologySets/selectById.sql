SELECT terminology_set_to_json(terminology_sets.*) AS object
FROM terminology_sets
WHERE
	terminology_sets.id = :terminologySetId
	AND has_terminology_set_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		terminology_sets.id,
		'view',
		'terminologySet'
	);
