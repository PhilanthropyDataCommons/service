INSERT INTO fiscal_sponsorships (
	fiscal_sponsee_changemaker_id,
	fiscal_sponsor_changemaker_id,
	created_by,
	not_after
) VALUES (
	:fiscalSponseeChangemakerId,
	:fiscalSponsorChangemakerId,
	:authContextKeycloakUserId,
	null
)
ON CONFLICT (fiscal_sponsee_changemaker_id, fiscal_sponsor_changemaker_id)
DO UPDATE SET not_after = null
-- It may be nice to return the sponsee changemaker here (returning prohibits).
RETURNING fiscal_sponsorship_to_json(fiscal_sponsorships) AS object;
