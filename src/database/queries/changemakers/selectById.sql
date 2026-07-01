WITH
	requested_changemaker AS (
		SELECT changemakers AS changemaker
		FROM changemakers
		WHERE changemakers.id = :changemakerId
	)

SELECT serialized_changemaker.object
FROM build_changemakers_results(
	array(SELECT requested_changemaker.changemaker FROM requested_changemaker),
	:authContextKeycloakUserId,
	:authContextIsAdministrator
) AS serialized_changemaker;
