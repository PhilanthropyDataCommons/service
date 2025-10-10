SELECT base_field_to_json(base_fields.*) AS object
FROM base_fields
WHERE
	CASE
		WHEN :sensitivityClassification::sensitivity_classification [] IS NULL
		THEN TRUE
		ELSE
			sensitivity_classification = any(
				:sensitivityClassification::sensitivity_classification []
			)
	END;
