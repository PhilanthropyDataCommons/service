-- Adjust the organizations table to reflect the new name
ALTER TABLE organizations RENAME TO changemakers;

-- Adjust the organizations_proposals table to reflect the new name
ALTER TABLE organizations_proposals RENAME to changemakers_proposals;
ALTER TABLE changemakers_proposals RENAME COLUMN organization_id TO changemaker_id;
COMMENT ON TABLE changemakers_proposals IS
  'Relationships between changemakers and proposals.';
COMMENT ON COLUMN changemakers_proposals.changemaker_id IS
  'Foreign key referencing changemakers(id).';

  -- Update the sources table to reflect the new name
  ALTER TABLE sources RENAME COLUMN organization_id TO changemaker_id;
  COMMENT ON COLUMN sources.changemaker_id IS
    'Foreign key referencing changemakers(id).';
