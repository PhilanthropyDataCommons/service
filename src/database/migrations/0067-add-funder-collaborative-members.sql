ALTER TABLE funders ADD COLUMN is_collaborative boolean NOT NULL DEFAULT false;
CREATE TABLE funder_collaborative_members (
	funder_collaborative_short_code short_code_t NOT NULL
	REFERENCES funders (short_code) ON DELETE CASCADE,
	member_funder_short_code short_code_t NOT NULL
	REFERENCES funders (short_code) ON DELETE CASCADE,
	-- If the user that created this happens to be deleted,
	-- we still don't want to delete this.
	created_by uuid REFERENCES users (keycloak_user_id)
	ON DELETE SET NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	not_after timestamp with time zone DEFAULT null,
	PRIMARY KEY (funder_collaborative_short_code, member_funder_short_code),
	CONSTRAINT no_self_membership CHECK (
		funder_collaborative_short_code != member_funder_short_code
	)

);

CREATE OR REPLACE FUNCTION prevent_inserting_non_collaborative_funder()
RETURNS trigger AS $$
DECLARE
    forbidden BOOLEAN;
BEGIN
    SELECT EXISTS (
			SELECT 1
				FROM funders
				WHERE funders.short_code = NEW.funder_collaborative_short_code
					AND funders.is_collaborative = false
		) INTO forbidden;

    IF forbidden THEN
        RAISE EXCEPTION 'Non-collaborative funder %', NEW.funder_collaborative_short_code
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION prevent_inserting_collaborative_member_funder()
RETURNS trigger AS $$
DECLARE
    forbidden BOOLEAN;
BEGIN
    SELECT EXISTS (
			SELECT 1
				FROM funders
				WHERE funders.short_code = NEW.member_funder_short_code
					AND funders.is_collaborative = true
		) INTO forbidden;

    IF forbidden THEN
        RAISE EXCEPTION 'Collaborative funder cannot be a member of another collaborative %', NEW.funder_collaborative_short_code
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER check_funder_is_non_collaborative
BEFORE INSERT ON funder_collaborative_members
FOR EACH ROW
EXECUTE FUNCTION prevent_inserting_non_collaborative_funder();

CREATE TRIGGER check_member_funder_is_collaborative
BEFORE INSERT ON funder_collaborative_members
FOR EACH ROW
EXECUTE FUNCTION prevent_inserting_collaborative_member_funder();

SELECT audit_table('funder_collaborative_members');

COMMENT ON COLUMN funders.is_collaborative IS
'To help the application prevent recursive collaboratives, a'
'funder must be either a collaborative or not a collaborative.';
