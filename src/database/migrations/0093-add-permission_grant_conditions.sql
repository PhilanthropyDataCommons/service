CREATE FUNCTION is_valid_permission_grant_conditions(conditions jsonb)
RETURNS boolean AS $$
DECLARE
	condition_key text;
	condition_value jsonb;
BEGIN
	-- NULL is valid (no conditions)
	IF conditions IS NULL THEN
		RETURN TRUE;
	END IF;

	-- Must be a JSON object
	IF jsonb_typeof(conditions) != 'object' THEN
		RETURN FALSE;
	END IF;

	-- Each key must be a valid entity type and each leaf must have the
	-- correct shape: { "property": <string>, "operator": <string>,
	-- "value": [<string>, ...] }
	FOR condition_key, condition_value IN
		SELECT * FROM jsonb_each(conditions)
	LOOP
		-- Key must be a valid entity type
		BEGIN
			PERFORM condition_key::permission_grant_entity_type_t;
		EXCEPTION WHEN invalid_text_representation THEN
			RETURN FALSE;
		END;

		-- Leaf must be an object
		IF jsonb_typeof(condition_value) != 'object' THEN
			RETURN FALSE;
		END IF;

		-- Must have exactly three keys: property, operator, value
		IF (
			SELECT count(*)
			FROM jsonb_object_keys(condition_value)
		) != 3
			OR NOT condition_value ? 'property'
			OR NOT condition_value ? 'operator'
			OR NOT condition_value ? 'value'
		THEN
			RETURN FALSE;
		END IF;

		-- property and operator must be strings
		IF jsonb_typeof(condition_value -> 'property') != 'string'
			OR jsonb_typeof(condition_value -> 'operator') != 'string'
		THEN
			RETURN FALSE;
		END IF;

		-- value must be a non-empty array of strings
		IF jsonb_typeof(condition_value -> 'value') != 'array'
			OR jsonb_array_length(condition_value -> 'value') < 1
			OR EXISTS (
				SELECT 1
				FROM jsonb_array_elements(condition_value -> 'value') AS elem
				WHERE jsonb_typeof(elem) != 'string'
			)
		THEN
			RETURN FALSE;
		END IF;
	END LOOP;

	RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE permission_grants
ADD COLUMN conditions jsonb
CONSTRAINT chk_conditions CHECK (
	is_valid_permission_grant_conditions(conditions)
);
