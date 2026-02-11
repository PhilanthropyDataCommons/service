-- Add 'proposalFieldValue' scope to existing permissions that have
-- 'proposal' scope.  This ensures backward compatibility: users who
-- previously could see proposals (including their field values) retain
-- that access under the new permission model.

UPDATE permission_grants
SET
	scope
	= array_append(scope, 'proposalFieldValue'::permission_grant_entity_type_t)
WHERE
	context_entity_type IN ('funder', 'changemaker', 'opportunity', 'proposal')
	AND 'proposal' = any(scope)
	AND NOT ('proposalFieldValue' = any(scope));
