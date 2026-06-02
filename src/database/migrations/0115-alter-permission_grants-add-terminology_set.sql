ALTER TABLE permission_grants
ADD COLUMN terminology_set_id
int REFERENCES terminology_sets (id) ON DELETE CASCADE;

SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'terminologySet', 'terminology_set_id'
);
