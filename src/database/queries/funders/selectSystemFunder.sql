WITH
	requested_funder AS (
		SELECT funders AS funder
		FROM funders
		WHERE funders.short_code = system_funder_short_code()
	)

SELECT serialized_funder.object
FROM build_funders_results(
	array(SELECT requested_funder.funder FROM requested_funder),
	:authContextKeycloakUserId,
	:authContextIsAdministrator
) AS serialized_funder;
