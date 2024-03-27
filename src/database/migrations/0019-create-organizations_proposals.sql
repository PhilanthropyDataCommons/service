CREATE TABLE organizations_proposals (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  organization_id INTEGER NOT NULL,
  proposal_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (proposal_id) REFERENCES proposals(id),
  UNIQUE(organization_id, proposal_id)
);

COMMENT ON TABLE organizations_proposals IS
  'Relationships between organizations and proposals.';
