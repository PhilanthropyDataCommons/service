SELECT drop_function('build_funders_results');

CREATE FUNCTION build_funders_results(
	funders funders [],
	auth_context_keycloak_user_id uuid DEFAULT NULL,
	auth_context_is_administrator boolean DEFAULT FALSE
) RETURNS TABLE (short_code short_code_t, object jsonb) AS $$
	WITH input_funders AS (
		SELECT f.* FROM unnest(build_funders_results.funders) AS f
	),

	permissions_json AS (
		SELECT
			p.funder_short_code,
			p.permissions
		FROM funder_permissions_json_among(
			build_funders_results.auth_context_keycloak_user_id,
			build_funders_results.auth_context_is_administrator,
			ARRAY(SELECT input_funder.short_code FROM input_funders AS input_funder)
		) AS p
	)

	SELECT
		input_funder.short_code,
		funder_to_json(
			input_funder.*,
			COALESCE(pj.permissions, '{}'::jsonb)
		) AS object
	FROM input_funders AS input_funder
	LEFT JOIN permissions_json pj
		ON pj.funder_short_code = input_funder.short_code;
$$ LANGUAGE sql STABLE;
