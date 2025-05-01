SELECT unified_audit_log_to_json(unified_audit_logs.*) AS object
FROM unified_audit_logs
ORDER BY unified_audit_logs.action_tstamp_stm DESC
LIMIT :limit OFFSET :offset;
