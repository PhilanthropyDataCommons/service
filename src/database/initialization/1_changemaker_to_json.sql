SELECT drop_function('changemaker_to_json');

CREATE FUNCTION changemaker_to_json(
	changemaker changemakers,
	fiscal_sponsors jsonb,
	fields jsonb,
	shallow boolean DEFAULT FALSE,
	auth_context_keycloak_user_id uuid DEFAULT NULL,
	auth_context_is_administrator boolean DEFAULT FALSE
) RETURNS jsonb AS $$
	SELECT CASE
		WHEN changemaker_to_json.auth_context_keycloak_user_id IS NULL THEN
			jsonb_build_object(
				'id', changemaker.id,
				'taxId', changemaker.tax_id,
				'name', changemaker.name
			) || CASE
				WHEN changemaker_to_json.shallow THEN '{}'::jsonb
				ELSE jsonb_build_object(
					'fields', COALESCE(changemaker_to_json.fields, '[]'::jsonb)
				)
			END
		ELSE
			jsonb_build_object(
				'id', changemaker.id,
				'taxId', changemaker.tax_id,
				'name', changemaker.name,
				'keycloakOrganizationId', changemaker.keycloak_organization_id,
				'createdAt', changemaker.created_at,
				'createdBy', changemaker.created_by
			) || CASE
				WHEN changemaker_to_json.shallow THEN '{}'::jsonb
				ELSE jsonb_build_object(
					'fiscalSponsors',
					COALESCE(changemaker_to_json.fiscal_sponsors, '[]'::jsonb),
					'fields', COALESCE(changemaker_to_json.fields, '[]'::jsonb)
				)
			END
	END;
$$ LANGUAGE sql IMMUTABLE;
