UPDATE initiative_field_values
SET
	value = update_if(:valueWasProvided, :value::text, value),
	source_id = update_if(:sourceIdWasProvided, :sourceId::integer, source_id),
	good_as_of = update_if(
		:goodAsOfWasProvided, :goodAsOf::timestamptz, good_as_of
	),
	is_valid = :isValid
WHERE
	id = :initiativeFieldValueId
	AND initiative_id = :initiativeId
RETURNING
	build_initiative_field_value_result(
		initiative_field_values,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object;
