-- Drop old function signatures that use permission_t
DROP FUNCTION IF EXISTS has_changemaker_permission(
	uuid, boolean, integer, permission_t
);
DROP FUNCTION IF EXISTS has_funder_permission(
	uuid, boolean, short_code_t, permission_t
);
DROP FUNCTION IF EXISTS has_data_provider_permission(
	uuid, boolean, short_code_t, permission_t
);

-- Now we can drop the type
DROP TYPE permission_t;
