ALTER TABLE changemakers
ADD COLUMN name_search tsvector
GENERATED ALWAYS AS (to_tsvector('english', name)) STORED;

CREATE INDEX idx_changemakers_name_search
ON changemakers
USING gin (name_search);
