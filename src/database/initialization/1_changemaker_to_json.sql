SELECT drop_function('changemaker_to_json');

CREATE FUNCTION changemaker_to_json(
	changemaker changemakers,
	fiscal_sponsors jsonb,
	fields jsonb,
	shallow boolean DEFAULT FALSE
) RETURNS jsonb AS $$
	SELECT jsonb_build_object(
		'id', changemaker.id,
		'taxId', changemaker.tax_id,
		'name', changemaker.name,
		'keycloakOrganizationId', changemaker.keycloak_organization_id,
		'createdAt', changemaker.created_at,
		'createdBy', changemaker.created_by
	) || CASE
		WHEN changemaker_to_json.shallow THEN '{}'::jsonb
		ELSE jsonb_build_object(
			'fiscalSponsors', COALESCE(changemaker_to_json.fiscal_sponsors, '[]'::jsonb),
			'fields', COALESCE(changemaker_to_json.fields, '[]'::jsonb)
		)
	END;
$$ LANGUAGE sql IMMUTABLE;
