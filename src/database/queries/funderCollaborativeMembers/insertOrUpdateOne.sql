MERGE INTO funder_collaborative_members
USING (VALUES (
	:funderCollaborativeShortCode::short_code_t,
	:memberFunderShortCode::short_code_t,
	:authContextKeycloakUserId::uuid
)) AS source (
	funder_collaborative_short_code,
	member_funder_short_code,
	created_by
)
ON
	funder_collaborative_members.funder_collaborative_short_code
	= source.funder_collaborative_short_code
	AND funder_collaborative_members.member_funder_short_code
	= source.member_funder_short_code
WHEN MATCHED THEN UPDATE SET not_after = NULL
WHEN NOT MATCHED THEN INSERT (
	funder_collaborative_short_code,
	member_funder_short_code,
	created_by
) VALUES (
	source.funder_collaborative_short_code,
	source.member_funder_short_code,
	source.created_by
)
RETURNING
	funder_collaborative_member_to_json(funder_collaborative_members) AS object,
	merge_action() = 'INSERT' AS "wasInserted";
