-- Add 'changemakerFieldValue' scope to existing permissions that have
-- 'changemaker' scope.  This ensures backward compatibility: users who
-- previously could see changemakers (including their field values) retain
-- that access under the new permission model.

UPDATE permission_grants
SET
	scope
	= array_append(scope, 'changemakerFieldValue'::permission_grant_entity_type_t)
WHERE
	context_entity_type = 'changemaker'
	AND 'changemaker' = any(scope)
	AND NOT ('changemakerFieldValue' = any(scope));
