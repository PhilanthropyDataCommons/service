INSERT INTO application_forms (
	opportunity_id,
	name,
	version
) VALUES (
	:opportunityId,
	:name,
	coalesce(
		(
			SELECT max(af.version) + 1
			FROM application_forms AS af
			WHERE af.opportunity_id = :opportunityId
		),
		1
	)
)
RETURNING application_form_to_json(application_forms) AS object;
