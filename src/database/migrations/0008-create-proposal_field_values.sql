CREATE TABLE proposal_field_values (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  proposal_version_id INTEGER NOT NULL,
  application_form_field_id INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  value VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_proposal_version
    FOREIGN KEY(proposal_version_id)
      REFERENCES proposal_versions(id),
  CONSTRAINT fk_application_form_field
    FOREIGN KEY(application_form_field_id)
      REFERENCES application_form_fields(id),
  UNIQUE(proposal_version_id, application_form_field_id, sequence)
);

COMMENT ON TABLE proposal_field_values IS
  'Values associated with specific fields which have been submitted as part of a proposal.';
