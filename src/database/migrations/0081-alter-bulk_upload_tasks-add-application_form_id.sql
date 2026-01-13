ALTER TABLE bulk_upload_tasks
ADD COLUMN application_form_id integer REFERENCES application_forms (id);
