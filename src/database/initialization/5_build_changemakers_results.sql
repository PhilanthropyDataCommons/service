SELECT drop_function('build_changemakers_results');

-- Serializes a page of changemakers (deep: with fiscal sponsors and gold field
-- values) in a single pass. See README: result builders. Takes rows, not ids,
-- so it never re-queries the changemakers table and can serialize a changemaker
-- INSERTed in the same statement.
--
-- The "fields" of a changemaker is the gold value per base field, chosen from
-- the union of its proposal field values and its changemaker field values by a
-- source-priority ordering. Gathering the whole page at once replaces the
-- per-changemaker query the row-by-row serializer ran.
CREATE FUNCTION build_changemakers_results(
	changemakers changemakers [],
	auth_context_keycloak_user_id uuid DEFAULT NULL,
	auth_context_is_administrator boolean DEFAULT FALSE
) RETURNS TABLE (id int, object jsonb) AS $$
	WITH input_changemakers AS (
		SELECT c.* FROM unnest(build_changemakers_results.changemakers) AS c
	),
	-- viewable field values, bounded to this page's field values
	permitted_proposal_field_values AS (
		SELECT p.id
		FROM permitted_proposal_field_value_ids_among(
			build_changemakers_results.auth_context_keycloak_user_id,
			build_changemakers_results.auth_context_is_administrator,
			'view', 'proposalFieldValue',
			ARRAY(
				SELECT pfv.id
				FROM proposal_field_values pfv
				INNER JOIN proposal_versions pv ON pfv.proposal_version_id = pv.id
				INNER JOIN changemakers_proposals op ON pv.proposal_id = op.proposal_id
				WHERE op.changemaker_id IN (SELECT ic.id FROM input_changemakers ic)
			)
		) AS p
	),
	permitted_changemaker_field_values AS (
		SELECT p.id
		FROM permitted_changemaker_field_value_ids_among(
			build_changemakers_results.auth_context_keycloak_user_id,
			build_changemakers_results.auth_context_is_administrator,
			'view', 'changemakerFieldValue',
			ARRAY(
				SELECT cfv.id
				FROM changemaker_field_values cfv
				WHERE cfv.changemaker_id IN (SELECT ic.id FROM input_changemakers ic)
			)
		) AS p
	),
	-- fiscal sponsors (shallow), only for authenticated users
	fiscal_sponsor_json AS (
		SELECT
			fs.fiscal_sponsee_changemaker_id AS changemaker_id,
			jsonb_agg(
				changemaker_to_json(
					sponsor.*, NULL, NULL, TRUE,
					build_changemakers_results.auth_context_keycloak_user_id,
					build_changemakers_results.auth_context_is_administrator
				) ORDER BY sponsor.id
			) AS fiscal_sponsors
		FROM fiscal_sponsorships fs
		INNER JOIN changemakers sponsor
			ON sponsor.id = fs.fiscal_sponsor_changemaker_id
		INNER JOIN users u
			ON u.keycloak_user_id
			= build_changemakers_results.auth_context_keycloak_user_id
		WHERE fs.fiscal_sponsee_changemaker_id IN (
			SELECT ic.id FROM input_changemakers ic
		)
			AND NOT is_expired(fs.not_after)
		GROUP BY fs.fiscal_sponsee_changemaker_id
	),
	-- gold field value id per base field, per changemaker. Chosen from metadata
	-- only (no serialization) so the discarded candidates are never serialized.
	gold_winner AS (
		SELECT DISTINCT ON (combined.changemaker_id, combined.base_field_short_code)
			combined.changemaker_id,
			combined.base_field_short_code,
			combined.source_kind,
			combined.field_value_id
		FROM (
			-- ProposalFieldValues
			SELECT
				op.changemaker_id,
				bf.short_code AS base_field_short_code,
				s.changemaker_id AS source_changemaker_id,
				s.funder_short_code AS source_funder_short_code,
				s.data_provider_short_code AS source_data_provider_short_code,
				s.id AS source_id,
				pfv.created_at,
				1 AS source_kind,
				pfv.id AS field_value_id
			FROM proposal_field_values pfv
			INNER JOIN application_form_fields aff
				ON pfv.application_form_field_id = aff.id
			INNER JOIN base_fields bf ON aff.base_field_short_code = bf.short_code
			INNER JOIN proposal_versions pv ON pfv.proposal_version_id = pv.id
			INNER JOIN changemakers_proposals op ON pv.proposal_id = op.proposal_id
			INNER JOIN sources s ON pv.source_id = s.id
			INNER JOIN permitted_proposal_field_values permitted
				ON permitted.id = pfv.id
			WHERE op.changemaker_id IN (SELECT ic.id FROM input_changemakers ic)
				AND bf.category = 'organization'
				AND pfv.is_valid
				AND (
					build_changemakers_results.auth_context_keycloak_user_id
					IS NULL
					OR EXISTS (
						SELECT 1
						FROM users u
						WHERE u.keycloak_user_id
							= build_changemakers_results.auth_context_keycloak_user_id
							AND u.keycloak_user_id != system_keycloak_user_id()
					)
				)

			UNION ALL

			-- ChangemakerFieldValues
			SELECT
				cfv.changemaker_id,
				cfv.base_field_short_code,
				s.changemaker_id AS source_changemaker_id,
				s.funder_short_code AS source_funder_short_code,
				s.data_provider_short_code AS source_data_provider_short_code,
				s.id AS source_id,
				cfv.created_at,
				2 AS source_kind,
				cfv.id AS field_value_id
			FROM changemaker_field_values cfv
			INNER JOIN base_fields bf ON cfv.base_field_short_code = bf.short_code
			INNER JOIN changemaker_field_value_batches cfvb ON cfv.batch_id = cfvb.id
			INNER JOIN sources s ON cfvb.source_id = s.id
			INNER JOIN permitted_changemaker_field_values permitted
				ON permitted.id = cfv.id
			WHERE cfv.changemaker_id IN (SELECT ic.id FROM input_changemakers ic)
				AND bf.category = 'organization'
				AND cfv.is_valid
				AND (
					build_changemakers_results.auth_context_keycloak_user_id
					IS NULL
					OR EXISTS (
						SELECT 1
						FROM users u
						WHERE u.keycloak_user_id
							= build_changemakers_results.auth_context_keycloak_user_id
							AND u.keycloak_user_id != system_keycloak_user_id()
					)
				)
		) AS combined
		ORDER BY
			combined.changemaker_id,
			combined.base_field_short_code,
			combined.source_changemaker_id IS NOT NULL DESC,
			combined.source_funder_short_code IS NOT NULL DESC,
			combined.source_data_provider_short_code IS NOT NULL
				AND combined.source_id != system_source_id() DESC,
			combined.created_at DESC,
			-- deterministic final tie-break so the gold pick never depends on
			-- scan order (and is identical whether one changemaker or a page)
			combined.source_kind,
			combined.field_value_id DESC
	),
	-- serialize only the winning field value per base field
	gold_field_json AS (
		SELECT
			winner.changemaker_id,
			jsonb_agg(
				winner.field_value_json ORDER BY winner.base_field_short_code
			) AS fields
		FROM (
			SELECT
				gold_winner.changemaker_id,
				gold_winner.base_field_short_code,
				CASE gold_winner.source_kind
					WHEN 1 THEN build_proposal_field_value_result(pfv.*)
					WHEN 2 THEN build_changemaker_field_value_result(
						cfv.*,
						build_changemakers_results.auth_context_keycloak_user_id,
						build_changemakers_results.auth_context_is_administrator
					)
				END AS field_value_json
			FROM gold_winner
			LEFT JOIN proposal_field_values pfv
				ON gold_winner.source_kind = 1
				AND pfv.id = gold_winner.field_value_id
			LEFT JOIN changemaker_field_values cfv
				ON gold_winner.source_kind = 2
				AND cfv.id = gold_winner.field_value_id
		) AS winner
		GROUP BY winner.changemaker_id
	)

	SELECT
		ic.id,
		changemaker_to_json(
			ic.*, fsj.fiscal_sponsors, gfj.fields, FALSE,
			build_changemakers_results.auth_context_keycloak_user_id,
			build_changemakers_results.auth_context_is_administrator
		) AS object
	FROM input_changemakers ic
	LEFT JOIN fiscal_sponsor_json fsj ON fsj.changemaker_id = ic.id
	LEFT JOIN gold_field_json gfj ON gfj.changemaker_id = ic.id;
$$ LANGUAGE sql STABLE;
