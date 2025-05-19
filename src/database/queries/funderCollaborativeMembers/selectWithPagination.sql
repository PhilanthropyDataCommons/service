SELECT
	funder_collaborative_member_to_json(funder_collaborative_members.*)
	AS object
FROM funder_collaborative_members
ORDER BY funder_collaborative_members.created_at DESC
LIMIT :limit OFFSET :offset;
