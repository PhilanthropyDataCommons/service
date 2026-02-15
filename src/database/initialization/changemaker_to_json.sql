SELECT drop_function('changemaker_to_json');

CREATE FUNCTION changemaker_to_json(
	changemaker changemakers,
	auth_context_keycloak_user_id uuid DEFAULT NULL,
	auth_context_is_administrator boolean DEFAULT FALSE,
	shallow boolean DEFAULT FALSE
)
RETURNS jsonb AS $$
DECLARE
	field_values_json JSONB;
	fiscal_sponsors_json JSONB;
	changemaker_json JSONB;
BEGIN
	-- Terminate changemaker recursion by setting shallow here. This means no fields or sponsors in sponsors.
	SELECT jsonb_agg(changemaker_to_json(fiscal_sponsors.*, auth_context_keycloak_user_id, auth_context_is_administrator, TRUE))
	INTO fiscal_sponsors_json
	FROM changemakers AS fiscal_sponsors
	INNER JOIN fiscal_sponsorships fs
		ON fs.fiscal_sponsor_changemaker_id = fiscal_sponsors.id
		AND fs.fiscal_sponsee_changemaker_id = changemaker.id
		AND NOT is_expired(fs.not_after)
	-- Remove values for unauthenticated calls while also (re)validating the user ID:
	INNER JOIN users u
		ON u.keycloak_user_id = auth_context_keycloak_user_id
	WHERE NOT shallow;

	-- Combine ProposalFieldValues and ChangemakerFieldValues, select gold per base field
	SELECT jsonb_agg(field_value_json)
	INTO field_values_json
	FROM (
		SELECT DISTINCT ON (base_field_short_code)
			field_value_json,
			base_field_short_code,
			source_changemaker_id,
			source_funder_short_code,
			source_data_provider_short_code,
			source_id,
			created_at
		FROM (
			-- ProposalFieldValues
			SELECT
				proposal_field_value_to_json(pfv.*) AS field_value_json,
				bf.short_code AS base_field_short_code,
				s.changemaker_id AS source_changemaker_id,
				s.funder_short_code AS source_funder_short_code,
				s.data_provider_short_code AS source_data_provider_short_code,
				s.id AS source_id,
				pfv.created_at
			FROM proposal_field_values pfv
			-- Remove field values for unauthenticated users while also (re)validating the user ID:
			INNER JOIN users u
				ON u.keycloak_user_id = auth_context_keycloak_user_id
			INNER JOIN application_form_fields aff
				ON pfv.application_form_field_id = aff.id
			INNER JOIN base_fields bf
				ON aff.base_field_short_code = bf.short_code
			INNER JOIN proposal_versions pv
				ON pfv.proposal_version_id = pv.id
			INNER JOIN changemakers_proposals op
				ON pv.proposal_id = op.proposal_id
			INNER JOIN sources s
				ON pv.source_id = s.id
			WHERE op.changemaker_id = changemaker.id
				AND bf.category = 'organization'
				AND pfv.is_valid
				-- Guard against possible removal of NON NULL constraint on users table:
				AND u.keycloak_user_id IS NOT NULL
				-- Guard against the valid-but-not-really-valid-here system user:
				AND u.keycloak_user_id != system_keycloak_user_id()
				-- Check permission to view this proposal field value:
				AND has_proposal_field_value_permission(
					auth_context_keycloak_user_id,
					auth_context_is_administrator,
					pfv.id,
					'view',
					'proposalFieldValue'
				)

			UNION ALL

			-- ChangemakerFieldValues
			SELECT
				changemaker_field_value_to_json(
					cfv.*,
					auth_context_keycloak_user_id,
					auth_context_is_administrator
				) AS field_value_json,
				cfv.base_field_short_code AS base_field_short_code,
				s.changemaker_id AS source_changemaker_id,
				s.funder_short_code AS source_funder_short_code,
				s.data_provider_short_code AS source_data_provider_short_code,
				s.id AS source_id,
				cfv.created_at
			FROM changemaker_field_values cfv
			-- Remove field values for unauthenticated users while also (re)validating the user ID:
			INNER JOIN users u
				ON u.keycloak_user_id = auth_context_keycloak_user_id
			INNER JOIN base_fields bf
				ON cfv.base_field_short_code = bf.short_code
			INNER JOIN changemaker_field_value_batches cfvb
				ON cfv.batch_id = cfvb.id
			INNER JOIN sources s
				ON cfvb.source_id = s.id
			WHERE cfv.changemaker_id = changemaker.id
				AND bf.category = 'organization'
				AND cfv.is_valid
				-- Guard against possible removal of NON NULL constraint on users table:
				AND u.keycloak_user_id IS NOT NULL
				-- Guard against the valid-but-not-really-valid-here system user:
				AND u.keycloak_user_id != system_keycloak_user_id()
				-- Check permission to view this changemaker field value:
				AND has_changemaker_field_value_permission(
					auth_context_keycloak_user_id,
					auth_context_is_administrator,
					cfv.id,
					'view',
					'changemakerFieldValue'
				)
		) AS combined_field_values
		ORDER BY
			base_field_short_code,
			-- The three "Source" sorts are as a class, not on an individual column within the class.
			-- In other words, if there are many funders that sourced data, they are treated equally
			-- until further sorted by the remaining (non-Source) sort clauses.
			-- Changemaker sourced data takes priority over funders and data platform providers.
			source_changemaker_id IS NOT NULL DESC,
			-- Funder sourced data takes priority over data platform providers.
			source_funder_short_code IS NOT NULL DESC,
			-- Data platform provider sourced data takes priority over old, default-pdc-sourced data.
			source_data_provider_short_code IS NOT NULL
				AND source_id != system_source_id() DESC,
			created_at DESC
	) AS gold_field_values
	WHERE NOT shallow;

	SELECT jsonb_build_object(
		'id', changemaker.id,
		'taxId', changemaker.tax_id,
		'name', changemaker.name,
		'keycloakOrganizationId', changemaker.keycloak_organization_id,
		'createdAt', changemaker.created_at
	) INTO changemaker_json;

	RETURN
		CASE WHEN shallow THEN
			changemaker_json
		ELSE
			changemaker_json || jsonb_build_object(
				'fiscalSponsors', COALESCE(fiscal_sponsors_json, '[]'::JSONB),
				'fields', COALESCE(field_values_json, '[]'::JSONB)
			)
		END;
END;
$$ LANGUAGE plpgsql;
