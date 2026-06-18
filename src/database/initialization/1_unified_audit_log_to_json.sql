SELECT drop_function('unified_audit_log_to_json');

CREATE FUNCTION unified_audit_log_to_json(
	unified_audit_log unified_audit_logs
)
RETURNS jsonb AS $$
BEGIN
	RETURN jsonb_build_object(
		'statementTimestamp', unified_audit_log.action_tstamp_stm,
		'userKeycloakUserId', unified_audit_log.user_keycloak_user_id,
		'userIsAdministrator', unified_audit_log.user_is_administrator,
		'pid', unified_audit_log.pid,
		'auditLevel', unified_audit_log.level,
		'operation', unified_audit_log.operation,
		'details', unified_audit_log.details
	);
END;
$$ LANGUAGE plpgsql;
