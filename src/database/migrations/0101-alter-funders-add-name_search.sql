ALTER TABLE funders
ADD COLUMN name_search tsvector
GENERATED ALWAYS AS (to_tsvector('english', name)) STORED;

CREATE INDEX idx_funders_name_search
ON funders
USING gin (name_search);
