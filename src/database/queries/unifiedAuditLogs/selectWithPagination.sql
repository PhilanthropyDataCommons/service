WITH
	candidate_entries AS MATERIALIZED (
		SELECT unified_audit_logs.*
		FROM unified_audit_logs
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	page AS (
		SELECT candidate_entries.*
		FROM candidate_entries
		ORDER BY action_tstamp_stm DESC
		LIMIT :limit OFFSET :offset
	),

	paginated_entries AS (
		SELECT
			unified_audit_log_to_json(
				page.*::unified_audit_logs
			) AS object
		FROM page
		ORDER BY action_tstamp_stm DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
