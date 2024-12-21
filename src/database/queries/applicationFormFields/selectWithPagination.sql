SELECT application_form_field_to_json(application_form_fields) AS object
FROM application_form_fields
WHERE
	CASE
		WHEN :applicationFormId::integer IS NULL THEN
			TRUE
		ELSE
			application_form_id = :applicationFormId
	END
ORDER BY position, id
LIMIT :limit OFFSET :offset;
