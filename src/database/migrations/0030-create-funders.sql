CREATE DOMAIN short_code_t AS TEXT CHECK (VALUE SIMILAR TO '[\w\-]+');

CREATE TABLE funders (
  short_code short_code_t PRIMARY KEY,
  name VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE funders IS
  'Organizations that accept grant proposals and / or provide funding.';
