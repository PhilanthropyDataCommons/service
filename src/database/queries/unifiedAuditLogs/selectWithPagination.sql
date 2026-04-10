WITH
	candidate_entries AS NOT MATERIALIZED (
		SELECT unified_audit_logs.*
		FROM unified_audit_logs
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT
			unified_audit_log_to_json(
				candidate_entries.*::unified_audit_logs
			) AS object
		FROM candidate_entries
		ORDER BY action_tstamp_stm DESC
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
