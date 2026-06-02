ALTER TABLE opportunities
ADD COLUMN terminology_set_id int,
ADD CONSTRAINT opportunities_terminology_set_fk
FOREIGN KEY (funder_short_code, terminology_set_id)
REFERENCES terminology_sets (funder_short_code, id)
ON DELETE SET NULL (terminology_set_id);
