SELECT proposal_to_json(proposals.*) AS object
FROM proposals
	INNER JOIN opportunities
		ON proposals.opportunity_id = opportunities.id
	LEFT JOIN proposal_versions ON proposals.id = proposal_versions.proposal_id
	LEFT JOIN
		proposal_field_values
		ON proposal_versions.id = proposal_field_values.proposal_version_id
	LEFT JOIN
		application_form_fields
		ON
			proposal_field_values.application_form_field_id = application_form_fields.id
	LEFT JOIN
		base_fields
		ON (
			application_form_fields.base_field_short_code = base_fields.short_code
		)
	LEFT JOIN
		changemakers_proposals
		ON proposals.id = changemakers_proposals.proposal_id
WHERE
	CASE
		WHEN :createdBy::uuid IS NULL THEN
			TRUE
		ELSE
			proposals.created_by = :createdBy
	END
	AND CASE
		WHEN (
			:search::text IS NULL
			OR :search = ''
		) THEN
			TRUE
		ELSE (
			base_fields.sensitivity_classification != 'forbidden'
			AND proposal_field_values.value_search
			@@ websearch_to_tsquery('english', :search::text)
		)
	END
	AND CASE
		WHEN :changemakerId::integer IS NULL THEN
			TRUE
		ELSE
			changemakers_proposals.changemaker_id = :changemakerId
	END
	AND CASE
		WHEN :funderShortCode::short_code_t IS NULL THEN
			TRUE
		ELSE
			opportunities.funder_short_code = :funderShortCode
	END
	AND (
		has_funder_permission(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			opportunities.funder_short_code,
			'view'
		)
		OR EXISTS (
			SELECT 1
			FROM changemakers_proposals AS permission_cp
			WHERE
				permission_cp.proposal_id = proposals.id
				AND has_changemaker_permission(
					:authContextKeycloakUserId,
					:authContextIsAdministrator,
					permission_cp.changemaker_id,
					'view',
					'changemaker'
				)
		)
	)
GROUP BY proposals.id
ORDER BY proposals.id DESC
LIMIT :limit OFFSET :offset;
