INSERT INTO opportunities (title, funder_short_code)
VALUES ('System Opportunity', system_funder_short_code());

CREATE OR REPLACE FUNCTION system_opportunity_id()
RETURNS integer AS $$
BEGIN
	RETURN (
		SELECT id FROM opportunities
		WHERE title = 'System Opportunity'
		AND funder_short_code = system_funder_short_code()
	);
END;
$$ LANGUAGE plpgsql;

INSERT INTO application_forms (opportunity_id, version)
VALUES (system_opportunity_id(), 1);

CREATE OR REPLACE FUNCTION system_application_form_id()
RETURNS integer AS $$
BEGIN
	RETURN (
		SELECT id FROM application_forms
		WHERE opportunity_id = system_opportunity_id()
		AND version = 1
	);
END;
$$ LANGUAGE plpgsql;
