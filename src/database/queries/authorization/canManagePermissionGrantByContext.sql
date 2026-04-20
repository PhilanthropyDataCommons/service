SELECT can_manage_permission_grant(
	:authContextKeycloakUserId,
	:authContextIsAdministrator,
	jsonb_populate_record(NULL::permission_grants, jsonb_build_object(
		'context_entity_type', :contextEntityType::text,
		'funder_short_code', :funderShortCode::text,
		'changemaker_id', :changemakerId::integer,
		'data_provider_short_code', :dataProviderShortCode::text,
		'opportunity_id', :opportunityId::integer,
		'proposal_id', :proposalId::integer,
		'proposal_version_id', :proposalVersionId::integer,
		'application_form_id', :applicationFormId::integer,
		'application_form_field_id', :applicationFormFieldId::integer,
		'proposal_field_value_id', :proposalFieldValueId::integer,
		'source_id', :sourceId::integer,
		'bulk_upload_task_id', :bulkUploadTaskId::integer,
		'changemaker_field_value_id', :changemakerFieldValueId::integer
	))
) AS result;
