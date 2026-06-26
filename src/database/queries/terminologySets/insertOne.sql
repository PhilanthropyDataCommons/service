INSERT INTO terminology_sets (
	funder_short_code,
	name,
	opportunity_label,
	opportunities_label,
	application_form_label,
	application_forms_label,
	proposal_label,
	proposals_label,
	created_by
) VALUES (
	:funderShortCode,
	:name,
	:opportunityLabel,
	:opportunitiesLabel,
	:applicationFormLabel,
	:applicationFormsLabel,
	:proposalLabel,
	:proposalsLabel,
	:authContextKeycloakUserId
)
RETURNING terminology_set_to_json(terminology_sets) AS object;
