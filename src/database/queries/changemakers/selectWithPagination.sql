SELECT DISTINCT
	o.id,
	changemaker_to_json(
		o.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM changemakers AS o
	LEFT JOIN changemakers_proposals AS op ON o.id = op.changemaker_id
WHERE
	CASE
		WHEN :proposalId::integer IS NULL THEN
			TRUE
		ELSE
			op.proposal_id = :proposalId
	END
	AND CASE
		WHEN (
			:search::text IS NULL
			OR :search = ''
		) THEN
			TRUE
		ELSE
			o.name_search
			@@ websearch_to_tsquery('english', :search::text)
	END
ORDER BY o.id DESC
LIMIT :limit OFFSET :offset;
