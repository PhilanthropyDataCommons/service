MERGE INTO fiscal_sponsorships
USING (VALUES (
	:fiscalSponseeChangemakerId::integer,
	:fiscalSponsorChangemakerId::integer,
	:authContextKeycloakUserId::uuid
)) AS source (
	fiscal_sponsee_changemaker_id,
	fiscal_sponsor_changemaker_id,
	created_by
)
ON
	fiscal_sponsorships.fiscal_sponsee_changemaker_id
	= source.fiscal_sponsee_changemaker_id
	AND fiscal_sponsorships.fiscal_sponsor_changemaker_id
	= source.fiscal_sponsor_changemaker_id
WHEN MATCHED THEN UPDATE SET not_after = NULL
WHEN NOT MATCHED THEN INSERT (
	fiscal_sponsee_changemaker_id,
	fiscal_sponsor_changemaker_id,
	created_by,
	not_after
) VALUES (
	source.fiscal_sponsee_changemaker_id,
	source.fiscal_sponsor_changemaker_id,
	source.created_by,
	NULL
)
RETURNING
	fiscal_sponsorship_to_json(fiscal_sponsorships) AS object,
	merge_action() = 'INSERT' AS "wasInserted";
