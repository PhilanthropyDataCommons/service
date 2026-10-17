MERGE INTO users
USING (
	SELECT
		value ->> 'id' AS keycloak_user_id,
		value ->> 'name' AS keycloak_user_name,
		COALESCE((value ->> 'enabled')::boolean, false) AS keycloak_user_enabled
	FROM jsonb_array_elements(:users::jsonb) AS value
) AS source
ON users.keycloak_user_id = source.keycloak_user_id::uuid
WHEN MATCHED THEN
	UPDATE SET
		-- Never blank a cached name when the brief payload omits names.
		keycloak_user_name = coalesce(
			source.keycloak_user_name,
			users.keycloak_user_name
		),
		synced_from_keycloak_at = now(),
		disabled_at = CASE
			WHEN source.keycloak_user_enabled THEN NULL
			ELSE users.disabled_at
		END
WHEN NOT MATCHED THEN
	INSERT (
		keycloak_user_id,
		keycloak_user_name,
		synced_from_keycloak_at
	)
	VALUES (
		source.keycloak_user_id::uuid,
		source.keycloak_user_name,
		now()
	)
RETURNING
	merge_action() = 'INSERT' AS "wasInserted";
