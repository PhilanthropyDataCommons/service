WITH
	candidate_entries AS MATERIALIZED (
		SELECT application_forms.*
		FROM application_forms
			INNER JOIN
				permitted_application_form_ids(
					:authContextKeycloakUserId,
					:authContextIsAdministrator,
					'view',
					'applicationForm'
				) AS permitted_application_forms
				ON application_forms.id = permitted_application_forms.id
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	page AS (
		SELECT candidate_entries.*
		FROM candidate_entries
		ORDER BY id
		LIMIT :limit OFFSET :offset
	),

	paginated_entries AS (
		SELECT
			application_form_to_json(
				page.*::application_forms
			) AS object
		FROM page
		ORDER BY id
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
