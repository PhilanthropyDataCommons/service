-- Create new columns which will become the foreign keys
ALTER TABLE bulk_uploads ADD COLUMN created_by_keycloak_user_id UUID;
ALTER TABLE proposals ADD COLUMN created_by_keycloak_user_id UUID;
ALTER TABLE proposal_versions ADD COLUMN created_by_keycloak_user_id UUID;

-- Update the new columns with appropriate values
UPDATE bulk_uploads
  SET created_by_keycloak_user_id = (
    SELECT keycloak_user_id FROM users WHERE id = bulk_uploads.created_by
  );
UPDATE proposals
  SET created_by_keycloak_user_id = (
    SELECT keycloak_user_id FROM users WHERE id = proposals.created_by
  );
UPDATE proposal_versions
  SET created_by_keycloak_user_id = (
    SELECT keycloak_user_id FROM users WHERE id = proposal_versions.created_by
  );

-- Add not null constraints
ALTER TABLE bulk_uploads ALTER COLUMN created_by_keycloak_user_id SET NOT NULL;
ALTER TABLE proposals ALTER COLUMN created_by_keycloak_user_id SET NOT NULL;
ALTER TABLE proposal_versions ALTER COLUMN created_by_keycloak_user_id SET NOT NULL;

-- Drop the existing foreign key constraints
ALTER TABLE bulk_uploads DROP CONSTRAINT fk_createdBy;
ALTER TABLE proposals DROP CONSTRAINT fk_createdBy;
ALTER TABLE proposal_versions DROP CONSTRAINT fk_createdBy;

-- Drop the existing foreign key columns
ALTER TABLE bulk_uploads DROP COLUMN created_by;
ALTER TABLE proposals DROP COLUMN created_by;
ALTER TABLE proposal_versions DROP COLUMN created_by;

-- Rename the new columns to replace the old column
ALTER TABLE bulk_uploads RENAME COLUMN created_by_keycloak_user_id TO created_by;
ALTER TABLE proposals RENAME COLUMN created_by_keycloak_user_id TO created_by;
ALTER TABLE proposal_versions RENAME COLUMN created_by_keycloak_user_id TO created_by;

-- Update the primary key on the users table
ALTER TABLE users
  DROP CONSTRAINT users_pkey,
  ADD PRIMARY KEY (keycloak_user_id);

-- Remove redundant unique constraint on keycloak_user_id
ALTER TABLE users DROP CONSTRAINT users_authentication_id_key;

-- Drop the previous foreign key column
ALTER TABLE users DROP COLUMN id;

-- Add the new foreign key constraints
ALTER TABLE bulk_uploads ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(keycloak_user_id);
ALTER TABLE proposals ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(keycloak_user_id);
ALTER TABLE proposal_versions ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(keycloak_user_id);
