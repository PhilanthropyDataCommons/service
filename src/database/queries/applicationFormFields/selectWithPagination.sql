WITH
	candidate_entries AS MATERIALIZED (
		SELECT application_form_fields.*
		FROM application_form_fields
		WHERE
			CASE
				WHEN :applicationFormId::integer IS NULL THEN
					TRUE
				ELSE
					application_form_fields.application_form_id = :applicationFormId
			END
			AND has_application_form_permission(
				:authContextKeycloakUserId,
				:authContextIsAdministrator,
				application_form_fields.application_form_id,
				'view',
				'applicationForm'
			)
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT
			application_form_field_to_json(
				candidate_entries.*::application_form_fields
			) AS object
		FROM candidate_entries
		ORDER BY position, id
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
