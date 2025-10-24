SELECT base_field_to_json(base_fields.*) AS object
FROM base_fields
WHERE
	CASE
		WHEN :sensitivityFilter.list::sensitivity_classification [] IS NULL
		THEN TRUE
		ELSE
			CASE
				WHEN :sensitivityFilter.negated THEN
					NOT (base_fields.sensitivity_classification = any(
						:sensitivityFilter.list::sensitivity_classification []
					))
				ELSE
					base_fields.sensitivity_classification = any(
						:sensitivityFilter.list::sensitivity_classification []
					)
			END
	END;
