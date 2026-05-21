UPDATE terminology_sets
SET
	name = update_if(:nameWasProvided, :name, name),
	opportunity_label
	= update_if(
		:opportunityLabelWasProvided, :opportunityLabel, opportunity_label
	),
	opportunities_label
	= update_if(
		:opportunitiesLabelWasProvided, :opportunitiesLabel, opportunities_label
	),
	application_form_label
	= update_if(
		:applicationFormLabelWasProvided,
		:applicationFormLabel,
		application_form_label
	),
	application_forms_label
	= update_if(
		:applicationFormsLabelWasProvided,
		:applicationFormsLabel,
		application_forms_label
	),
	proposal_label
	= update_if(:proposalLabelWasProvided, :proposalLabel, proposal_label),
	proposals_label
	= update_if(:proposalsLabelWasProvided, :proposalsLabel, proposals_label)
WHERE id = :terminologySetId
RETURNING terminology_set_to_json(terminology_sets) AS object;
