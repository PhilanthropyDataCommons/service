CREATE OR REPLACE FUNCTION is_expired(
	not_after timestamp with time zone DEFAULT NULL
)
RETURNS boolean AS $$
	SELECT not_after IS NOT NULL AND not_after < now();
$$ LANGUAGE sql STABLE;
