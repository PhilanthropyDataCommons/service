INSERT INTO sources ( label, source_type ) VALUES ( 'PDC', 'system' );

CREATE OR REPLACE FUNCTION select_system_source_id()
RETURNS INTEGER AS $$
DECLARE
    system_source_id INTEGER;
BEGIN
    SELECT id INTO system_source_id FROM sources WHERE source_type = 'system';
    RETURN system_source_id;
END;
$$ LANGUAGE plpgsql;
