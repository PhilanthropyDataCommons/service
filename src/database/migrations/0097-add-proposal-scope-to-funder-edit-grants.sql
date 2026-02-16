UPDATE permission_grants
SET scope = array_append(scope, 'proposal'::permission_grant_entity_type_t)
WHERE
	context_entity_type = 'funder'
	AND 'edit' = any(verbs)
	AND 'funder' = any(scope)
	AND NOT ('proposal' = any(scope));
