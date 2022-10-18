CREATE TABLE proposals (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  applicant_id INTEGER NOT NULL,
  opportunity_id INTEGER NOT NULL,
  external_id VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(applicant_id, opportunity_id, external_id),
  CONSTRAINT fk_applicant
    FOREIGN KEY(applicant_id)
      REFERENCES applicants(id),
  CONSTRAINT fk_opportunity
    FOREIGN KEY(opportunity_id)
      REFERENCES opportunities(id)
);

COMMENT ON TABLE proposals IS
  'Sets of values submitted by applicants in response to an opportunity stored in the PDC.';
COMMENT ON COLUMN proposals.external_id IS
  'The client identifier associated with a given proposal. There cannot be more than one proposal with the same external ID for a given applicant + opportunity pair.';
COMMENT ON COLUMN proposals.applicant_id IS
  'The applicant that submitted this proposal.';
