ALTER TABLE users
  ALTER COLUMN authentication_id TYPE UUID
  RENAME authentication_id TO keycloak_id;


EDIT: probably need to migrate the user function here as well
