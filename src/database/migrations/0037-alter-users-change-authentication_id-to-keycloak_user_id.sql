-- Update the system user's authentication_id to a predictable UUID
UPDATE users
SET authentication_id = '00000000-0000-0000-0000-000000000000'
WHERE id = select_system_user_id();

CREATE OR REPLACE FUNCTION system_keycloak_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN '00000000-0000-0000-0000-000000000000';
END;
$$ LANGUAGE plpgsql;

-- Move authentication_id to keycloak_user_id
ALTER TABLE users
RENAME COLUMN authentication_id TO keycloak_user_id;

ALTER TABLE users
ALTER COLUMN keycloak_user_id TYPE UUID USING keycloak_user_id::UUID;

-- Update (and rename) the system user id function
DROP FUNCTION IF EXISTS select_system_user_id();

CREATE OR REPLACE FUNCTION system_user_id()
RETURNS INTEGER AS $$
DECLARE
  user_id INTEGER;
BEGIN
  SELECT id INTO user_id FROM users WHERE keycloak_user_id = system_keycloak_user_id();
  RETURN user_id;
END;
$$ LANGUAGE plpgsql;
