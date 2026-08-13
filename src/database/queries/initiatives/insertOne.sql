INSERT INTO initiatives (
	changemaker_id,
	title,
	created_by
) VALUES (
	:changemakerId,
	:title,
	:authContextKeycloakUserId
)
RETURNING initiative_to_json(initiatives) AS object;
