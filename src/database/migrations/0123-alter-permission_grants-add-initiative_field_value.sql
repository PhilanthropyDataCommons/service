ALTER TABLE permission_grants
ADD COLUMN initiative_field_value_id
int REFERENCES initiative_field_values (id) ON DELETE CASCADE;

SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'initiativeFieldValue', 'initiative_field_value_id'
);
