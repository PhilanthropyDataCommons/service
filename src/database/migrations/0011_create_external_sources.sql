CREATE TABLE external_sources (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  label TEXT,
  website TEXT,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
)
