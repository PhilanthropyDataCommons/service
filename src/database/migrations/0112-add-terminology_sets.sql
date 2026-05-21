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

ALTER TABLE funders
ADD COLUMN default_terminology_set_id int,
ADD CONSTRAINT funders_default_terminology_set_fk
FOREIGN KEY (short_code, default_terminology_set_id)
REFERENCES terminology_sets (funder_short_code, id)
ON DELETE SET NULL (default_terminology_set_id);

ALTER TABLE opportunities
ADD COLUMN terminology_set_id int,
ADD CONSTRAINT opportunities_terminology_set_fk
FOREIGN KEY (funder_short_code, terminology_set_id)
REFERENCES terminology_sets (funder_short_code, id)
ON DELETE SET NULL (terminology_set_id);

ALTER TABLE permission_grants
ADD COLUMN terminology_set_id
int REFERENCES terminology_sets (id) ON DELETE CASCADE;

SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'terminologySet', 'terminology_set_id'
);
