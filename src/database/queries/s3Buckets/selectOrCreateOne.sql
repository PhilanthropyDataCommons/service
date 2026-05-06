MERGE INTO s3_buckets
USING (VALUES (
	:name::text,
	:region::text,
	:endpoint::text
)) AS source (
	name,
	region,
	endpoint
)
ON s3_buckets.name = source.name
-- No-op SET so RETURNING fires for existing rows (selectOrCreate semantics).
WHEN MATCHED THEN UPDATE SET name = source.name
WHEN NOT MATCHED THEN INSERT (
	name,
	region,
	endpoint
) VALUES (
	source.name,
	source.region,
	source.endpoint
)
RETURNING
	s3_bucket_to_json(s3_buckets.*) AS object,
	merge_action() = 'INSERT' AS "wasInserted";
