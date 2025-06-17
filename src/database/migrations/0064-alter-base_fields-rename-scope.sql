-- 1. Create the new enum type
CREATE TYPE base_field_category AS ENUM (
	'project',
	'organization',
	'needs_assessment',
	'methodology',
	'budget',
	'evaluation',
	'sustainability',
	'partnerships',
	'outcomes',
	'technical',
	'uncategorized'
);

-- 2. Add a new column of the new enum type
ALTER TABLE base_fields
ADD COLUMN category base_field_category;

COMMENT ON COLUMN base_fields.category IS
'The category of data that the base field is intended to reflect.';

-- 3. Copy over data from scope to category, mapping 'proposal' → 'project'
UPDATE base_fields
SET category = CASE scope
	WHEN 'proposal' THEN 'project'::base_field_category
	ELSE scope::text::base_field_category
END;

-- 4. Add NOT NULL and default to the new column
ALTER TABLE base_fields
ALTER COLUMN category SET NOT NULL;

-- 5. Drop the old column
ALTER TABLE base_fields
DROP COLUMN scope;

-- 6. Drop the old enum
DROP TYPE field_scope;
