ALTER TABLE bulk_upload_tasks
ADD COLUMN application_form_id integer REFERENCES application_forms (id);

UPDATE bulk_upload_tasks
SET application_form_id = system_application_form_id()
WHERE application_form_id IS NULL;

ALTER TABLE bulk_upload_tasks
ALTER COLUMN application_form_id SET NOT NULL;

ALTER TABLE bulk_upload_tasks
DROP COLUMN funder_short_code;
