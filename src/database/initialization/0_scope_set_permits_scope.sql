SELECT drop_function('scope_set_permits_scope');

-- Returns TRUE when `scope` is in `scopes`, or when `scopes` contains 'any'
-- (a granted 'any' scope satisfies any scope check).
CREATE FUNCTION scope_set_permits_scope(
	scopes permission_grant_entity_type_t [],
	scope permission_grant_entity_type_t
) RETURNS boolean AS $$
	SELECT scope = ANY(scopes) OR 'any' = ANY(scopes);
$$ LANGUAGE sql IMMUTABLE;
