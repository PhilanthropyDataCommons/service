CREATE TABLE proposal_versions (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  proposal_id INTEGER NOT NULL,
  application_form_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_proposal
    FOREIGN KEY(proposal_id)
      REFERENCES proposals(id),
  CONSTRAINT fk_application_form
    FOREIGN KEY(application_form_id)
      REFERENCES application_forms(id),
  UNIQUE(proposal_id, version)
);

COMMENT ON TABLE proposal_versions IS
  'Versioned sets of values associated with a given proposal stored in the PDC.';
