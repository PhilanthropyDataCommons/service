ALTER TABLE base_fields
ADD COLUMN value_relevance_hours integer;

COMMENT ON COLUMN base_fields.value_relevance_hours IS
'Duration (in hours) for which values of this base field are considered relevant.'; -- noqa: LT05
