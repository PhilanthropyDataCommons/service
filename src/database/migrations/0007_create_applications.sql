CREATE TABLE applications (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  applicant_id INTEGER,
  opportunity_id INTEGER,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_applicant
    FOREIGN KEY(applicant_id)
      REFERENCES applicants(id),
  CONSTRAINT fk_opportunity
    FOREIGN KEY(opportunity_id)
      REFERENCES opportunities(id)
)
