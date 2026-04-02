UPDATE permission_grants
SET
	grantee_type = :granteeType::permission_grant_grantee_type_t,
	grantee_user_keycloak_user_id = :granteeUserKeycloakUserId::uuid,
	grantee_keycloak_organization_id = :granteeKeycloakOrganizationId::uuid,
	context_entity_type = :contextEntityType::permission_grant_entity_type_t,
	changemaker_id = :changemakerId::integer,
	funder_short_code = :funderShortCode::text,
	data_provider_short_code = :dataProviderShortCode::text,
	opportunity_id = :opportunityId::integer,
	proposal_id = :proposalId::integer,
	proposal_version_id = :proposalVersionId::integer,
	application_form_id = :applicationFormId::integer,
	application_form_field_id = :applicationFormFieldId::integer,
	proposal_field_value_id = :proposalFieldValueId::integer,
	source_id = :sourceId::integer,
	bulk_upload_task_id = :bulkUploadTaskId::integer,
	changemaker_field_value_id = :changemakerFieldValueId::integer,
	scope = :scope::permission_grant_entity_type_t [],
	verbs = :verbs::permission_grant_verb_t [],
	conditions = :conditions::jsonb
WHERE id = :permissionGrantId
RETURNING permission_grant_to_json(permission_grants) AS object;
