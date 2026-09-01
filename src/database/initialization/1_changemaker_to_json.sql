SELECT drop_function('changemaker_to_json');

CREATE FUNCTION changemaker_to_json(
	changemaker changemakers,
	fiscal_sponsors jsonb,
	fields jsonb,
	shallow boolean DEFAULT FALSE,
	with_view_permission boolean DEFAULT TRUE
) RETURNS jsonb AS $$
	SELECT jsonb_build_object(
		'id', changemaker.id,
		'taxId', changemaker.tax_id,
		'name', changemaker.name
	) || CASE
		WHEN changemaker_to_json.shallow THEN '{}'::jsonb
		ELSE jsonb_build_object(
			'fields', COALESCE(changemaker_to_json.fields, '[]'::jsonb)
		)
	END || CASE
		WHEN NOT changemaker_to_json.with_view_permission THEN '{}'::jsonb
		ELSE jsonb_build_object(
			'keycloakOrganizationId', changemaker.keycloak_organization_id,
			'createdAt', changemaker.created_at,
			'createdBy', changemaker.created_by
		)
	END || CASE
		WHEN changemaker_to_json.shallow
			OR NOT changemaker_to_json.with_view_permission
			THEN '{}'::jsonb
		ELSE jsonb_build_object(
			'fiscalSponsors',
			COALESCE(changemaker_to_json.fiscal_sponsors, '[]'::jsonb)
		)
	END;
$$ LANGUAGE sql IMMUTABLE;
