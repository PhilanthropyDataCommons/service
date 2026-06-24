-- We need this because with RETURNING we can't access the related changemaker.
SELECT drop_function('fiscal_sponsorship_to_json');

CREATE FUNCTION fiscal_sponsorship_to_json(
	fiscal_sponsorship fiscal_sponsorships
)
RETURNS jsonb AS $$
BEGIN
	RETURN jsonb_build_object(
		'fiscalSponseeChangemakerId', fiscal_sponsorship.fiscal_sponsee_changemaker_id,
		'fiscalSponsorChangemakerId', fiscal_sponsorship.fiscal_sponsor_changemaker_id,
		'notAfter', fiscal_sponsorship.not_after,
		'createdBy', fiscal_sponsorship.created_by,
		'createdAt', fiscal_sponsorship.created_at
	);
END;
$$ LANGUAGE plpgsql;
