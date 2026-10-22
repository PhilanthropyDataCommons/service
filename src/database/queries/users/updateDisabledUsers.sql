-- Record when each user was last observed as absent or disabled. The
-- statement may run in a transaction that began some time ago, and the
-- recorded time is compared against JWT issuance times, so use
-- clock_timestamp(), which is not fixed at transaction start. Re-stamping
-- keeps the time the latest observation.
UPDATE users
SET disabled_at = clock_timestamp()
WHERE
	users.keycloak_user_id <> system_keycloak_user_id()
	AND NOT EXISTS (
		SELECT 1
		FROM jsonb_array_elements(:users::jsonb) AS value
		WHERE
			value ->> 'id' = users.keycloak_user_id::text
			AND coalesce((value ->> 'enabled')::boolean, FALSE)
	)
RETURNING users.keycloak_user_id;
