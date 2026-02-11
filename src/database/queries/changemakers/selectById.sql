SELECT
	changemaker_to_json(
		changemakers.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM changemakers
WHERE id = :changemakerId;
