ALTER TABLE funders ADD COLUMN is_collaborative boolean NOT NULL DEFAULT false;
CREATE TABLE funder_collaborative_members (
  funder_collaborative_short_code short_code_t NOT NULL
  REFERENCES funders (short_code) ON DELETE CASCADE,
  member_short_code short_code_t NOT NULL
  REFERENCES funders (short_code) ON DELETE CASCADE,
  -- If the user that created this happens to be deleted, we still don't want to delete this.
	created_by uuid REFERENCES users (keycloak_user_id)
	ON DELETE SET NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (funder_collaborative_short_code, member_short_code),
	CONSTRAINT no_self_membership CHECK (
		funder_collaborative_short_code != member_short_code
	)
);

COMMENT ON COLUMN funders.is_collaborative IS
'To help the application prevent recursive collaboratives, '
'a funder must be either a collaborative or not a collaborative.';

-- There is no way to check the `funders.is_collaborative` in the foreign table `funders` as part
-- of a check constraint on `funder_collaborative_members`, unfortunately. It is up to the app.
