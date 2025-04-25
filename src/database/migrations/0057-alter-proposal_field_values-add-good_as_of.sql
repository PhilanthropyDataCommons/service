ALTER TABLE proposal_field_values
ADD COLUMN good_as_of timestamp with time zone;

COMMENT ON COLUMN proposal_field_values.good_as_of IS
'The timestamp representing when this value was considered applicable.';
