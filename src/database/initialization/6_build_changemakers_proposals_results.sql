SELECT drop_function('build_changemakers_proposals_results');

-- Serializes a page of changemaker-proposals in a single pass (see README:
-- result builders). Volatile, not STABLE: the embedded proposal reads its
-- changemakers from changemakers_proposals, so the insert path needs a fresh
-- snapshot to see the row it just inserted.
CREATE FUNCTION build_changemakers_proposals_results(
	changemakers_proposals changemakers_proposals [],
	auth_context_keycloak_user_id uuid DEFAULT NULL,
	auth_context_is_administrator boolean DEFAULT FALSE
) RETURNS TABLE (id int, object jsonb) AS $$
	WITH input_entries AS (
		SELECT cp.*
		FROM unnest(
			build_changemakers_proposals_results.changemakers_proposals
		) AS cp
	),
	changemaker_json AS (
		SELECT serialized_changemaker.id, serialized_changemaker.object
		FROM build_changemakers_results(
			ARRAY(
				SELECT c
				FROM changemakers c
				WHERE c.id IN (SELECT ie.changemaker_id FROM input_entries ie)
			),
			build_changemakers_proposals_results.auth_context_keycloak_user_id,
			build_changemakers_proposals_results.auth_context_is_administrator
		) AS serialized_changemaker
	),
	proposal_json AS (
		SELECT serialized_proposal.id, serialized_proposal.object
		FROM build_proposals_results(
			ARRAY(
				SELECT p
				FROM proposals p
				WHERE p.id IN (SELECT ie.proposal_id FROM input_entries ie)
			),
			build_changemakers_proposals_results.auth_context_keycloak_user_id,
			build_changemakers_proposals_results.auth_context_is_administrator
		) AS serialized_proposal
	)

	SELECT
		ie.id,
		changemaker_proposal_to_json(ie, cj.object, pj.object) AS object
	FROM input_entries ie
	LEFT JOIN changemaker_json cj ON cj.id = ie.changemaker_id
	LEFT JOIN proposal_json pj ON pj.id = ie.proposal_id;
$$ LANGUAGE sql VOLATILE;
