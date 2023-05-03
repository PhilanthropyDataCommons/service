ALTER TABLE proposal_field_values
  ADD COLUMN value_search tsvector
    GENERATED ALWAYS AS (to_tsvector('english', value)) STORED;

CREATE INDEX idx_value_search ON proposal_field_values USING GIN(value_search);
