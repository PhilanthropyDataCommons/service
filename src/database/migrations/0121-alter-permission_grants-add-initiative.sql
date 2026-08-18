ALTER TABLE permission_grants
ADD COLUMN initiative_id
int REFERENCES initiatives (id) ON DELETE CASCADE;

SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'initiative', 'initiative_id'
);
