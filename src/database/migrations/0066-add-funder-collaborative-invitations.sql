CREATE TYPE invitation_status AS ENUM (
	'pending', 'accepted', 'rejected'
);
CREATE TABLE funder_collaborative_invitations (
	funder_short_code short_code_t NOT NULL
	REFERENCES funders (short_code) ON DELETE CASCADE,
	invitation_short_code short_code_t NOT NULL
	REFERENCES funders (short_code) ON DELETE CASCADE,
	invitation_status invitation_status NOT NULL,
	created_by uuid REFERENCES users (keycloak_user_id)
	ON DELETE SET NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	PRIMARY KEY (funder_short_code, invitation_short_code),
	CONSTRAINT no_self_invitation CHECK (
		funder_short_code != invitation_short_code
	)
);

CREATE OR REPLACE FUNCTION prevent_inserting_non_collaborative_inviter_funder()
RETURNS trigger AS $$
DECLARE
    forbidden BOOLEAN;
BEGIN
    SELECT EXISTS (
			SELECT 1
				FROM funders
				WHERE funders.short_code = NEW.funder_short_code
					AND funders.is_collaborative = false
		) INTO forbidden;

    IF forbidden THEN
        RAISE EXCEPTION 'Non-collaborative funder %', NEW.funder_short_code
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION prevent_inserting_collaborative_invitation_funder()
RETURNS trigger AS $$
DECLARE
    forbidden BOOLEAN;
BEGIN
    SELECT EXISTS (
			SELECT 1
				FROM funders
				WHERE funders.short_code = NEW.invitation_short_code
					AND funders.is_collaborative = true
		) INTO forbidden;

    IF forbidden THEN
        RAISE EXCEPTION 'Invitation funder cannot be a collaborative funder %', NEW.invitation_short_code
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER check_funder_is_non_collaborative
BEFORE INSERT ON funder_collaborative_invitations
FOR EACH ROW
EXECUTE FUNCTION prevent_inserting_non_collaborative_inviter_funder();

CREATE TRIGGER check_invitation_funder_is_collaborative
BEFORE INSERT ON funder_collaborative_invitations
FOR EACH ROW
EXECUTE FUNCTION prevent_inserting_collaborative_invitation_funder();
