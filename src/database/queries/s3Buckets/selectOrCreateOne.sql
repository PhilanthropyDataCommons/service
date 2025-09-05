INSERT INTO s3_buckets (name, region, endpoint)
VALUES (:name, :region, :endpoint)
ON CONFLICT (name)
DO UPDATE SET name = s3_buckets.name
RETURNING s3_bucket_to_json(s3_buckets.*) AS object;
