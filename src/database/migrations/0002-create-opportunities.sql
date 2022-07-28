CREATE TABLE opportunities (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE opportunities IS
  'Funding opportunities such as available grants or awards.';
COMMENT ON COLUMN opportunities.title IS
  'The external identifier; not necessarily unique across organizations.';
