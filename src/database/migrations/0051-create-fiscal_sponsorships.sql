CREATE TABLE fiscal_sponsorships (
	fiscal_sponsee_changemaker_id int NOT NULL REFERENCES changemakers (id)
	ON DELETE CASCADE,
	fiscal_sponsor_changemaker_id int NOT NULL REFERENCES changemakers (id)
	ON DELETE CASCADE,
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id)
	ON DELETE CASCADE,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	not_after timestamp with time zone DEFAULT NULL,
	-- The reason for this key order is we expect most lookups to be by sponsee.
	PRIMARY KEY (fiscal_sponsee_changemaker_id, fiscal_sponsor_changemaker_id),
	CONSTRAINT no_self_sponsorship CHECK (
		fiscal_sponsee_changemaker_id != fiscal_sponsor_changemaker_id
	)
);

COMMENT ON TABLE fiscal_sponsorships IS 'Current or past fiscal sponsorships
between changemakers.';
COMMENT ON COLUMN fiscal_sponsorships.not_after IS 'A DELETE due to erroneous
data input sets this field. It does not imply duration of the sponsorship.';
