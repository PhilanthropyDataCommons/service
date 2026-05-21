SELECT drop_function('terminology_set_to_json');

CREATE FUNCTION terminology_set_to_json(terminology_set terminology_sets)
RETURNS jsonb AS $$
BEGIN
	RETURN jsonb_build_object(
		'id', terminology_set.id,
		'funderShortCode', terminology_set.funder_short_code,
		'name', terminology_set.name,
		'opportunityLabel', terminology_set.opportunity_label,
		'opportunitiesLabel', terminology_set.opportunities_label,
		'applicationFormLabel', terminology_set.application_form_label,
		'applicationFormsLabel', terminology_set.application_forms_label,
		'proposalLabel', terminology_set.proposal_label,
		'proposalsLabel', terminology_set.proposals_label,
		'createdAt', to_json(terminology_set.created_at),
		'createdBy', to_json(terminology_set.created_by)
	);
END;
$$ LANGUAGE plpgsql;
