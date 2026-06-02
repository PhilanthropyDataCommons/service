ALTER TABLE funders
ADD COLUMN default_terminology_set_id int,
ADD CONSTRAINT funders_default_terminology_set_fk
FOREIGN KEY (short_code, default_terminology_set_id)
REFERENCES terminology_sets (funder_short_code, id)
ON DELETE SET NULL (default_terminology_set_id);
