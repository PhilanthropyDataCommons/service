INSERT INTO initiative_field_values (
	initiative_id,
	base_field_short_code,
	source_id,
	value,
	is_valid,
	good_as_of,
	created_by
) VALUES (
	:initiativeId,
	:baseFieldShortCode,
	:sourceId,
	:value,
	:isValid,
	:goodAsOf,
	auth_context_user_keycloak_user_id(:authContextId)
)
RETURNING
	build_initiative_field_value_result(
		initiative_field_values,
		:authContextId,
		:authContextIsAdministrator
	) AS object;
