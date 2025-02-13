UPDATE fiscal_sponsorships
SET not_after = now()
WHERE
	fiscal_sponsee_changemaker_id = :fiscalSponseeChangemakerId
	AND fiscal_sponsor_changemaker_id = :fiscalSponsorChangemakerId
	AND NOT is_expired(not_after);
