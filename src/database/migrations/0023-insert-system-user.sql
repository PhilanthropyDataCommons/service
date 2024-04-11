INSERT INTO users ( authentication_id ) VALUES ( '' );

CREATE OR REPLACE FUNCTION select_system_user_id()
RETURNS INTEGER AS $$
DECLARE
    admin_id INTEGER;
BEGIN
    SELECT id INTO admin_id FROM users WHERE authentication_id = '';
    RETURN admin_id;
END;
$$ LANGUAGE plpgsql;
