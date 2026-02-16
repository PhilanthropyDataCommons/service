CREATE OR REPLACE FUNCTION evaluate_permission_conditions(
	conditions jsonb,
	scope_key text,
	entity_data jsonb
) RETURNS boolean AS $$
DECLARE
	condition jsonb;
	field_name text;
	op text;
	condition_value jsonb;
	actual_value text;
BEGIN
	-- If conditions is NULL or doesn't contain the scope key, grant applies unconditionally
	IF conditions IS NULL OR NOT conditions ? scope_key THEN
		RETURN TRUE;
	END IF;

	condition := conditions->scope_key;
	field_name := condition->>'field';
	op := condition->>'operator';
	condition_value := condition->'value';
	actual_value := entity_data->>field_name;

	-- If the entity data doesn't have the field, the condition fails
	IF actual_value IS NULL THEN
		RETURN FALSE;
	END IF;

	IF op = 'in' THEN
		RETURN actual_value IN (
			SELECT jsonb_array_elements_text(condition_value)
		);
	END IF;

	-- Unknown operator, deny by default
	RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
