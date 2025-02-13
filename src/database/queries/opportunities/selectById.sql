SELECT opportunity_to_json(opportunities) AS object
FROM opportunities
WHERE id = :opportunityId
	AND (
		:auth_context_is_admin
		OR
		has_funder_permission(
			:auth_context_user_keycloak_user_id,
			funder_shortcode,
			'READ'
		)
	)
