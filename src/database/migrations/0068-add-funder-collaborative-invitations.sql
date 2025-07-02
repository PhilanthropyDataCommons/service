CREATE TYPE invitation_status_t AS ENUM (
	'pending', 'accepted', 'rejected'
);
CREATE TABLE funder_collaborative_invitations (
	funder_collaborative_short_code short_code_t NOT NULL
	REFERENCES funders (short_code) ON DELETE CASCADE,
	invited_funder_short_code short_code_t NOT NULL
	REFERENCES funders (short_code) ON DELETE CASCADE,
	invitation_status invitation_status_t NOT NULL,
	created_by uuid REFERENCES users (keycloak_user_id)
	ON DELETE SET NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	not_after timestamp with time zone DEFAULT NULL,
	PRIMARY KEY (funder_collaborative_short_code, invited_funder_short_code),
	CONSTRAINT no_self_invitation CHECK (
		funder_collaborative_short_code != invited_funder_short_code
	)
);

CREATE OR REPLACE FUNCTION
prevent_inserting_non_collaborative_funder_collaborative()
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


CREATE OR REPLACE FUNCTION prevent_inserting_collaborative_invited_funder()
RETURNS trigger AS $$
DECLARE
    forbidden BOOLEAN;
BEGIN
    SELECT EXISTS (
			SELECT 1
				FROM funders
				WHERE funders.short_code = NEW.invited_funder_short_code
					AND funders.is_collaborative = true
		) INTO forbidden;

    IF forbidden THEN
        RAISE EXCEPTION 'Invitation funder cannot be a collaborative funder %', NEW.invited_funder_short_code
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE
FUNCTION prevent_updating_invitation_status_if_accepted_or_rejected()
RETURNS trigger AS $$
BEGIN
    IF OLD.invitation_status IN ('accepted', 'rejected')
        THEN
        RAISE EXCEPTION 'Cannot modify invitation_status after it has been responded to'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER check_funder_is_non_collaborative
BEFORE INSERT ON funder_collaborative_invitations
FOR EACH ROW
EXECUTE FUNCTION prevent_inserting_non_collaborative_funder_collaborative();

CREATE TRIGGER check_invitation_funder_is_collaborative
BEFORE INSERT ON funder_collaborative_invitations
FOR EACH ROW
EXECUTE FUNCTION prevent_inserting_collaborative_invited_funder();

CREATE TRIGGER prevent_invitation_status_update_if_accepted_or_rejected
BEFORE UPDATE OF invitation_status ON funder_collaborative_invitations
FOR EACH ROW
EXECUTE FUNCTION prevent_updating_invitation_status_if_accepted_or_rejected();

SELECT audit_table('funder_collaborative_invitations');
