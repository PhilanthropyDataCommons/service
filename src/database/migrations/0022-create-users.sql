CREATE TABLE users (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  authentication_id VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(authentication_id)
);

COMMENT ON TABLE users IS
  'Authenticated users in the PDC.';
COMMENT ON COLUMN users.authentication_id IS
  'The principal identifier associated with the user within the authentication system.';
