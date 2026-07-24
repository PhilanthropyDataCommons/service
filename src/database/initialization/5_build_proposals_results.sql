SELECT drop_function('build_proposals_results');

-- Serializes a page of proposals in a single pass (see README: result
-- builders). Takes rows, not ids, so it never re-queries the proposals table
-- and can serialize a proposal INSERTed earlier in the same statement -- which
-- a STABLE function's snapshot would not otherwise see -- so callers pass rows.
CREATE FUNCTION build_proposals_results(
	proposals proposals [],
	auth_context_keycloak_user_id uuid DEFAULT NULL,
	auth_context_is_administrator boolean DEFAULT FALSE
) RETURNS TABLE (id int, object jsonb) AS $$
	WITH input_proposals AS (
		SELECT p.* FROM unnest(build_proposals_results.proposals) AS p
	),
	target_versions AS (
		SELECT pv.* FROM proposal_versions pv
		WHERE pv.proposal_id IN (SELECT ip.id FROM input_proposals ip)
	),
	-- viewable field values, bounded to this page's field values so the
	-- permission lookup is proportional to the page, not the whole corpus
	permitted_field_values AS (
		SELECT p.id
		FROM permitted_proposal_field_value_ids_among(
			build_proposals_results.auth_context_keycloak_user_id,
			build_proposals_results.auth_context_is_administrator,
			'view', 'proposalFieldValue',
			ARRAY(
				SELECT pfv.id
				FROM proposal_field_values pfv
				INNER JOIN target_versions tv ON tv.id = pfv.proposal_version_id
			)
		) AS p
	),
	application_form_field_json AS (
		SELECT aff.id, application_form_field_to_json(aff.*) AS object
		FROM application_form_fields aff
		WHERE aff.id IN (
			SELECT pfv.application_form_field_id
			FROM proposal_field_values pfv
			INNER JOIN target_versions tv ON tv.id = pfv.proposal_version_id
		)
	),
	field_value_json AS (
		SELECT
			pfv.proposal_version_id,
			jsonb_agg(
				proposal_field_value_to_json(
					pfv,
					affj.object,
					proposal_field_value_file_to_json(
						pfv, bf.data_type = 'file', tv.created_by
					),
					tv.proposal_id
				)
				ORDER BY pfv.position, pfv.id DESC
			) AS field_values
		FROM proposal_field_values pfv
		INNER JOIN target_versions tv ON tv.id = pfv.proposal_version_id
		INNER JOIN permitted_field_values pf ON pf.id = pfv.id
		INNER JOIN application_form_field_json affj
			ON affj.id = pfv.application_form_field_id
		INNER JOIN application_form_fields aff
			ON aff.id = pfv.application_form_field_id
		INNER JOIN base_fields bf ON bf.short_code = aff.base_field_short_code
		GROUP BY pfv.proposal_version_id
	),
	source_json AS (
		SELECT s.id, source_to_json(
			s.*,
			build_proposals_results.auth_context_keycloak_user_id,
			build_proposals_results.auth_context_is_administrator
		) AS object
		FROM sources s
		WHERE s.id IN (SELECT tv.source_id FROM target_versions tv)
	),
	version_json AS (
		SELECT
			tv.proposal_id,
			jsonb_agg(
				proposal_version_to_json(tv, fvj.field_values, sj.object)
				ORDER BY tv.version DESC, tv.id DESC
			) AS versions
		FROM target_versions tv
		LEFT JOIN field_value_json fvj ON fvj.proposal_version_id = tv.id
		LEFT JOIN source_json sj ON sj.id = tv.source_id
		GROUP BY tv.proposal_id
	),
	opportunity_json AS (
		SELECT o.id, opportunity_to_json(
			o.*,
			build_proposals_results.auth_context_keycloak_user_id,
			build_proposals_results.auth_context_is_administrator
		) AS object
		FROM opportunities o
		WHERE o.id IN (SELECT ip.opportunity_id FROM input_proposals ip)
	),
	changemaker_json AS (
		SELECT
			cp.proposal_id,
			jsonb_agg(
				changemaker_to_json(c.*, NULL, NULL, TRUE)
				ORDER BY c.id ASC
			) AS changemakers
		FROM changemakers_proposals cp
		INNER JOIN changemakers c ON c.id = cp.changemaker_id
		WHERE cp.proposal_id IN (SELECT ip.id FROM input_proposals ip)
		GROUP BY cp.proposal_id
	)

	SELECT
		ip.id,
		proposal_to_json(ip, oj.object, vj.versions, cj.changemakers) AS object
	FROM input_proposals ip
	LEFT JOIN version_json vj ON vj.proposal_id = ip.id
	LEFT JOIN opportunity_json oj ON oj.id = ip.opportunity_id
	LEFT JOIN changemaker_json cj ON cj.proposal_id = ip.id;
$$ LANGUAGE sql STABLE;
