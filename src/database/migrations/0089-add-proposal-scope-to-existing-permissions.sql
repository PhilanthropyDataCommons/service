-- Add 'proposal' scope to existing funder and changemaker permissions to
-- maintain backward compatibility with the previous implicit proposal access.
--
-- Previously, having funder-scope permission on a funder or changemaker-scope
-- permission on a changemaker implicitly granted access to associated
-- proposals. Now that proposal permissions are explicit, we need to add the
-- proposal scope to preserve this behavior.

UPDATE permission_grants
SET scope = array_append(scope, 'proposal'::permission_grant_entity_type_t)
WHERE
	context_entity_type IN ('funder', 'changemaker')
	AND NOT ('proposal' = any(scope));
