-- 1. Add new columns to tables fkeyd on basefields
ALTER TABLE base_field_localizations
ADD COLUMN base_field_short_code varchar;
ALTER TABLE application_form_fields
ADD COLUMN base_field_short_code varchar;

-- 2. Populate the new column by joining the base_fields table.
UPDATE base_field_localizations
SET base_field_short_code = base_fields.short_code
FROM base_fields
WHERE base_field_localizations.base_field_id = base_fields.id;
UPDATE application_form_fields
SET base_field_short_code = base_fields.short_code
FROM base_fields
WHERE application_form_fields.base_field_id = base_fields.id;

-- 3. Ensure the new column has a NOT NULL constraint.
ALTER TABLE base_field_localizations
ALTER COLUMN base_field_short_code SET NOT NULL;
ALTER TABLE application_form_fields
ALTER COLUMN base_field_short_code SET NOT NULL;

-- 4. Drop the old foreign key column base_field_id.
ALTER TABLE base_field_localizations
DROP COLUMN base_field_id;
ALTER TABLE application_form_fields
DROP COLUMN base_field_id;

-- 5. Add the new primary key on (base_field_short_code, language)
ALTER TABLE base_field_localizations
ADD PRIMARY KEY (base_field_short_code, language);

-- 6. On the base_fields table, drop the old primary key constraint.
ALTER TABLE base_fields
DROP CONSTRAINT canonical_fields_pkey;

-- 7. Add a new primary key on the "short_code" column.
ALTER TABLE base_fields
ADD PRIMARY KEY (short_code);

-- 8. Drop the old "id" column from base_fields.
ALTER TABLE base_fields
DROP COLUMN id;

-- 9. Add a new foreign key constraint.
ALTER TABLE base_field_localizations
ADD CONSTRAINT base_field_short_code_fkey
FOREIGN KEY (base_field_short_code) REFERENCES base_fields (short_code);
ALTER TABLE application_form_fields
ADD CONSTRAINT base_field_short_code_fkey
FOREIGN KEY (base_field_short_code) REFERENCES base_fields (short_code);
