WITH
	candidate_entries AS MATERIALIZED (
		SELECT application_form_fields.*
		FROM application_form_fields
			INNER JOIN
				permitted_application_form_ids(
					:authContextKeycloakUserId,
					:authContextIsAdministrator,
					'view',
					'applicationForm'
				) AS permitted_application_forms
				ON
					application_form_fields.application_form_id
					= permitted_application_forms.id
		WHERE
			CASE
				WHEN :applicationFormId::integer IS NULL THEN
					TRUE
				ELSE
					application_form_fields.application_form_id = :applicationFormId
			END
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	page AS (
		SELECT candidate_entries.*
		FROM candidate_entries
		ORDER BY position, id
		LIMIT :limit OFFSET :offset
	),

	paginated_entries AS (
		SELECT
			application_form_field_to_json(
				page.*::application_form_fields
			) AS object
		FROM page
		ORDER BY position, id
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
