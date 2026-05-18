-- Application form permissions are now explicit. Previously, any grant
-- with `opportunity` scope on a funder or opportunity context implicitly
-- conferred access to application forms (and their fields). Add the new
-- `applicationForm` scope to those grants so that users who relied on
-- inherited access retain it under the new permission model.

UPDATE permission_grants
SET
	scope
	= array_append(scope, 'applicationForm'::permission_grant_entity_type_t)
WHERE
	context_entity_type IN ('funder', 'opportunity')
	AND 'opportunity' = any(scope)
	AND NOT ('applicationForm' = any(scope));
