INSERT INTO initiatives (
	changemaker_id,
	title,
	created_by
) VALUES (
	:changemakerId,
	:title,
	auth_context_user_keycloak_user_id(:authContextId)
)
RETURNING initiative_to_json(initiatives) AS object;
