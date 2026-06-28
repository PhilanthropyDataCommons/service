-- Add indexes on columns that the permission functions, the entity listing
-- queries, and the to_json builders filter and join on. These columns are
-- exercised on nearly every authenticated request but were previously
-- unindexed, forcing sequential scans that degrade as the data grows. This
-- migration also indexes the permission_grants foreign keys so cascading
-- deletes of referenced entities no longer scan the whole table.

-- permitted_* functions all lead with `WHERE context_entity_type = '<type>'`
-- before applying the grantee check; grants to authenticatedUsers and user
-- groups are not covered by the existing partial grantee indexes.
CREATE INDEX idx_permission_grants_context_entity_type
ON permission_grants (context_entity_type);

-- proposals.opportunity_id is joined to opportunities and used for permission
-- inheritance; it is not the leading column of the existing unique constraint.
CREATE INDEX idx_proposals_opportunity_id
ON proposals (opportunity_id);

-- proposals.created_by is an optional filter on the proposal listing.
CREATE INDEX idx_proposals_created_by
ON proposals (created_by);

-- opportunities.funder_short_code is filtered in proposal listing and used for
-- funder-based permission inheritance.
CREATE INDEX idx_opportunities_funder_short_code
ON opportunities (funder_short_code);

-- changemakers_proposals.proposal_id is filtered by proposal_to_json and joined
-- in proposal listing; it is not the leading column of the unique constraint
-- (which leads with changemaker_id).
CREATE INDEX idx_changemakers_proposals_proposal_id
ON changemakers_proposals (proposal_id);

-- proposal_field_values join columns are exercised by proposal listing and the
-- proposal_version_to_json builder; only a GIN index on value_search existed.
CREATE INDEX idx_proposal_field_values_proposal_version_id
ON proposal_field_values (proposal_version_id);

CREATE INDEX idx_proposal_field_values_application_form_field_id
ON proposal_field_values (application_form_field_id);

-- proposal_versions.application_form_id is joined when building proposal
-- versions.
CREATE INDEX idx_proposal_versions_application_form_id
ON proposal_versions (application_form_id);

-- sources permission inheritance (permitted_source_ids) joins on each of these
-- columns to resolve funder-, data-provider-, and changemaker-derived access.
CREATE INDEX idx_sources_funder_short_code
ON sources (funder_short_code);

CREATE INDEX idx_sources_data_provider_short_code
ON sources (data_provider_short_code);

CREATE INDEX idx_sources_changemaker_id
ON sources (changemaker_id);

-- permission_grants context foreign keys. The permitted_* read functions filter
-- on context_entity_type rather than these columns, but each unindexed foreign
-- key forces a sequential scan of permission_grants when the referenced entity
-- is deleted (ON DELETE CASCADE).
CREATE INDEX idx_permission_grants_changemaker_id
ON permission_grants (changemaker_id);

CREATE INDEX idx_permission_grants_funder_short_code
ON permission_grants (funder_short_code);

CREATE INDEX idx_permission_grants_data_provider_short_code
ON permission_grants (data_provider_short_code);

CREATE INDEX idx_permission_grants_opportunity_id
ON permission_grants (opportunity_id);

CREATE INDEX idx_permission_grants_proposal_id
ON permission_grants (proposal_id);

CREATE INDEX idx_permission_grants_proposal_version_id
ON permission_grants (proposal_version_id);

CREATE INDEX idx_permission_grants_application_form_id
ON permission_grants (application_form_id);

CREATE INDEX idx_permission_grants_application_form_field_id
ON permission_grants (application_form_field_id);

CREATE INDEX idx_permission_grants_proposal_field_value_id
ON permission_grants (proposal_field_value_id);

CREATE INDEX idx_permission_grants_source_id
ON permission_grants (source_id);

CREATE INDEX idx_permission_grants_bulk_upload_task_id
ON permission_grants (bulk_upload_task_id);

CREATE INDEX idx_permission_grants_changemaker_field_value_id
ON permission_grants (changemaker_field_value_id);

CREATE INDEX idx_permission_grants_terminology_set_id
ON permission_grants (terminology_set_id);
