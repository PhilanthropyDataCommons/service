SELECT :authContextIsAdministrator::boolean OR EXISTS (
	SELECT 1 FROM
		permitted_funder_short_codes(
			:authContextKeycloakUserId, :authContextIsAdministrator, 'manage', 'funder'
		) AS f
	WHERE
		:contextEntityType::text = 'funder'
		AND f.short_code = :funderShortCode::short_code_t
	UNION ALL
	SELECT 1 FROM
		permitted_data_provider_short_codes(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'manage',
			'dataProvider'
		) AS dp
	WHERE
		:contextEntityType::text = 'dataProvider'
		AND dp.short_code = :dataProviderShortCode::short_code_t
	UNION ALL
	SELECT 1 FROM
		permitted_changemaker_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'manage',
			'changemaker'
		) AS c
	WHERE
		:contextEntityType::text = 'changemaker' AND c.id = :changemakerId::integer
	UNION ALL
	SELECT 1 FROM
		permitted_opportunity_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'manage',
			'opportunity'
		) AS o
	WHERE
		:contextEntityType::text = 'opportunity' AND o.id = :opportunityId::integer
	UNION ALL
	SELECT 1 FROM
		permitted_source_ids(
			:authContextKeycloakUserId, :authContextIsAdministrator, 'manage', 'source'
		) AS s
	WHERE :contextEntityType::text = 'source' AND s.id = :sourceId::integer
	UNION ALL
	SELECT 1 FROM
		permitted_application_form_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'manage',
			'applicationForm'
		) AS af
	WHERE
		:contextEntityType::text = 'applicationForm'
		AND af.id = :applicationFormId::integer
	UNION ALL
	SELECT 1 FROM
		permitted_proposal_ids(
			:authContextKeycloakUserId, :authContextIsAdministrator, 'manage', 'proposal'
		) AS p
	WHERE :contextEntityType::text = 'proposal' AND p.id = :proposalId::integer
	UNION ALL
	SELECT 1 FROM
		permitted_changemaker_field_value_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'manage',
			'changemakerFieldValue'
		) AS cfv
	WHERE
		:contextEntityType::text = 'changemakerFieldValue'
		AND cfv.id = :changemakerFieldValueId::integer
	UNION ALL
	SELECT 1 FROM
		permitted_proposal_field_value_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'manage',
			'proposalFieldValue'
		) AS pfv
	WHERE
		:contextEntityType::text = 'proposalFieldValue'
		AND pfv.id = :proposalFieldValueId::integer
) AS result;
