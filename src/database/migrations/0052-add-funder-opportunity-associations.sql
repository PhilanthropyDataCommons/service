INSERT INTO funders (short_code, name) VALUES (
	'pdc', 'System Placeholder Funder'
);

CREATE OR REPLACE FUNCTION system_funder_short_code()
RETURNS varchar AS $$
BEGIN
    RETURN 'pdc';
END;
$$ LANGUAGE plpgsql;

ALTER TABLE opportunities
ADD COLUMN funder_short_code short_code_t NOT NULL REFERENCES funders (
	short_code
) DEFAULT 'pdc';

ALTER TABLE opportunities
ALTER COLUMN funder_short_code DROP DEFAULT;

ALTER TABLE bulk_upload_tasks
ADD COLUMN funder_short_code short_code_t NOT NULL REFERENCES funders (
	short_code
) DEFAULT 'pdc';
ALTER TABLE bulk_upload_tasks
ALTER COLUMN funder_short_code DROP DEFAULT;

COMMENT ON COLUMN bulk_upload_tasks.funder_short_code IS
'The funder to associate with opportunities created by this bulk upload task.';
