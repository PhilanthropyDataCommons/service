CREATE OR REPLACE FUNCTION update_if(
	condition boolean,
	new_value anyelement,
	old_value anyelement
) RETURNS anyelement AS $$
BEGIN
    RETURN CASE WHEN condition THEN new_value ELSE old_value END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
