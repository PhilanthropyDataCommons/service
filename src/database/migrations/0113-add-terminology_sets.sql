CREATE TABLE terminology_sets (
	id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	funder_short_code
	short_code_t NOT NULL REFERENCES funders (short_code) ON DELETE CASCADE,
	name text NOT NULL,
	opportunity_label text,
	opportunities_label text,
	application_form_label text,
	application_forms_label text,
	proposal_label text,
	proposals_label text,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	CONSTRAINT terminology_sets_funder_id_uniq UNIQUE (funder_short_code, id),
	CONSTRAINT terminology_sets_funder_name_uniq UNIQUE (funder_short_code, name)
);

COMMENT ON TABLE terminology_sets IS
'Funder-authored display-label overrides for canonical PDC concepts. '
'NULL label columns indicate that the PDC default label should be used.';

SELECT audit_table('terminology_sets');
