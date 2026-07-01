WITH
	candidate_entries AS MATERIALIZED (
		SELECT changemakers.*
		FROM changemakers
		WHERE
			CASE
				WHEN :proposalId::integer IS NULL THEN
					TRUE
				ELSE
					EXISTS (
						SELECT 1
						FROM changemakers_proposals
						WHERE
							changemakers_proposals.changemaker_id = changemakers.id
							AND changemakers_proposals.proposal_id = :proposalId
					)
			END
			AND CASE
				WHEN (
					:search::text IS NULL
					OR :search = ''
				) THEN
					TRUE
				ELSE
					changemakers.name_search
					@@ websearch_to_tsquery('english', :search::text)
			END
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	page AS (
		SELECT candidate_entries.id
		FROM candidate_entries
		ORDER BY candidate_entries.id DESC
		LIMIT :limit OFFSET :offset
	),

	page_changemakers AS (
		SELECT changemakers AS changemaker
		FROM changemakers
		WHERE changemakers.id IN (SELECT page.id FROM page)
	),

	paginated_entries AS (
		SELECT serialized_changemaker.object
		FROM page
			INNER JOIN
				build_changemakers_results(
					array(SELECT page_changemakers.changemaker FROM page_changemakers),
					:authContextKeycloakUserId,
					:authContextIsAdministrator
				) AS serialized_changemaker
				ON page.id = serialized_changemaker.id
		ORDER BY page.id DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
