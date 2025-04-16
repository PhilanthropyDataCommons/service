CREATE TABLE audit_logs_2 (
	action_tstamp_stm timestamp with time zone NOT NULL
	DEFAULT statement_timestamp(),
	user_keycloak_user_id uuid REFERENCES users (keycloak_user_id),
	pid integer NOT NULL DEFAULT pg_backend_pid(),
	query_name text NOT NULL,
	query_parameters jsonb
);
CREATE INDEX audit_logs_2_action_tstamp_stm_idx
ON audit_logs_2 (action_tstamp_stm);
CREATE INDEX audit_logs_2_action_user_keycloak_user_id_idx
ON audit_logs_2 (user_keycloak_user_id);
COMMENT ON TABLE audit_logs_2 IS
'Audit log of calls to database-query functions made in the PDC service.';
COMMENT ON COLUMN audit_logs_2.action_tstamp_stm IS
'The time at which the statement causing the `INSERT` to this row began. Can '
'be used for temporal correlation with rows in lower-level audit_logs table. '
'The audit_logs row will precede this row temporally.';
COMMENT ON COLUMN audit_logs_2.user_keycloak_user_id IS
'The user ID, if available, that caused the function call. This will often be '
'duplicated in the query_parameters but querying by user is here anticipated.';
COMMENT ON COLUMN audit_logs_2.pid IS
'Session ID aka connection ID aka backend process ID used. Can be used for '
'session correlation with rows in lower-level audit_logs table.';
COMMENT ON COLUMN audit_logs_2.query_name IS
'The name of the PDC application query called.';
COMMENT ON COLUMN audit_logs_2.query_parameters IS
'Key-value (parameter-argument) pairs passed to the query.';

CREATE VIEW audit_logs_unified (
	action_tstamp_stm,
	user_keycloak_user_id,
	pid,
	level,
	operation,
	details
)
AS SELECT
	action_tstamp_stm,
	user_keycloak_user_id,
	pid,
	level,
	operation,
	details
FROM (
	SELECT
		event_id,
		action_tstamp_stm,
		NULL::uuid AS user_keycloak_user_id,
		pid,
		'1'::smallint AS level,
		CASE
			WHEN action = 'I' THEN 'INSERT INTO ' || table_name
			WHEN action = 'U' THEN 'UPDATE ' || table_name
			WHEN action = 'T' THEN 'TRUNCATE ' || table_name
			WHEN action = 'D' THEN 'DELETE FROM ' || table_name
			WHEN action = 'A' THEN 'Begin auditing ' || table_name
			WHEN action = 'S' THEN 'Stop auditing ' || table_name
			ELSE action || ' ' || table_name
		END
		AS operation,
		CASE
			-- 'U' is a special snowflake where a diff from row_data is provided.
			WHEN action = 'U' THEN changed_fields
			ELSE row_data
		END
		AS details
	FROM audit_logs
	-- Filter out updates that did not actually change anything.
	WHERE action != 'U' OR changed_fields IS NOT NULL
	UNION ALL
	SELECT
		NULL AS event_id,
		action_tstamp_stm,
		user_keycloak_user_id,
		pid,
		'2'::smallint AS level,
		'Called query ' || query_name AS operation,
		query_parameters AS details
	FROM audit_logs_2
) AS unified
-- Often the level 1 items begin share statement timestamps so use event_id too
ORDER BY action_tstamp_stm, event_id;

COMMENT ON VIEW audit_logs_unified IS
'A unified, simplified view into multiple levels of audit logs.';
COMMENT ON COLUMN audit_logs_unified.action_tstamp_stm IS
'The time at which the SQL statement of the operation began.';
COMMENT ON COLUMN audit_logs_unified.user_keycloak_user_id IS
'When available, the Keycloak UUID of the user that caused the action. '
'Not available below level 2 and only sometimes at level 2.';
COMMENT ON COLUMN audit_logs_unified.pid IS
'Session ID aka connection ID aka backend process ID used.';
COMMENT ON COLUMN audit_logs_unified.level IS
'The level of audit logging. 1 for database triggers, 2 for PDC queries.';
COMMENT ON COLUMN audit_logs_unified.operation IS
'A human-readable description of what happened. Varies by level.';
COMMENT ON COLUMN audit_logs_unified.details IS
'Detailed JSON map with the row values (level 1) or arguments (level 2).';
