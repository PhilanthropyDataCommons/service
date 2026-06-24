WITH
	candidate_entries AS MATERIALIZED (
		SELECT application_forms.*
		FROM application_forms
		WHERE
			has_application_form_permission(
				:authContextKeycloakUserId,
				:authContextIsAdministrator,
				application_forms.id,
				'view',
				'applicationForm'
			)
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT
			application_form_to_json(
				candidate_entries.*::application_forms
			) AS object
		FROM candidate_entries
		ORDER BY id
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
