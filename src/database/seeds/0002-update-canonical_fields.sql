-- Use the included UPDATE statements to update/delete/insert canonical fields.

-- This script helps get a development database started with some canonical fields.
-- Run this in sequence, in other words, run 0001-...sql followed by 0002-...sql, etc.

-- Usage example 1: `psql -d pdc -U pdc -p 5432 -f 0002-update-fields_and_forms.sql`
-- Usage example 2: `cat 0002-update-fields_and_forms.sql` then copy/paste into a `psql` session.

-- Fix a typo in an existing field.
UPDATE canonical_fields
  SET label = 'Proposal Fiscal Sponsor Contact Last Name',
    short_code = 'proposal_fiscal_sponsor_contact_last_name'
  WHERE short_code = 'proposal_fiscal_sponsor_cantact_last_name';

-- Rename an existing numeric field to be an explicit count.
UPDATE canonical_fields
  SET label = 'Organization Board Members - Count',
    short_code = 'organization_board_members_count'
  WHERE short_code = 'organization_board_members';

-- Add back 'Organization Board Members' but with a different shortCode.
-- Intentionally use a different code from the original to avoid accidental re-use:
INSERT INTO canonical_fields (
  label,
  short_code,
  data_type
) VALUES (
  'Organization Board Members',
  'organization_board_members_names',
  '{ "type": "string" }'
);

-- Clarify that a field is boolean.
UPDATE canonical_fields
  SET label = 'Organization Has Conflict of Interest Policy',
    short_code = 'organization_has_conflict_of_interest_policy',
    data_type = '{ "type": "boolean" }'
  WHERE short_code = 'organization_conflict_of_interest_policy';

-- Distinguish Project Title from Proposal Name by adding Project
UPDATE canonical_fields
  SET label = 'Proposal Project Title',
    short_code = 'proposal_project_title'
  WHERE short_code = 'proposal_title';

-- The following fields are no longer available in the original spreadsheet, delete them.
-- Each delete is its own statement such that if the field is used, that delete will fail.
DELETE FROM canonical_fields WHERE short_code = 'adaptablity_metrics_score';
DELETE FROM canonical_fields WHERE short_code = 'administrative_expense_ratio';
DELETE FROM canonical_fields WHERE short_code = 'administrative_expense_score';
DELETE FROM canonical_fields WHERE short_code = 'benchmark_for_comparision';
DELETE FROM canonical_fields WHERE short_code = 'category_of_charity';
DELETE FROM canonical_fields WHERE short_code = 'cause_of_charity';
DELETE FROM canonical_fields WHERE short_code = 'cost_per_outcome_statement';
DELETE FROM canonical_fields WHERE short_code = 'created_l&a_score_date';
DELETE FROM canonical_fields WHERE short_code = 'data_source_for_calculation';
DELETE FROM canonical_fields WHERE short_code = 'data_time_period_';
DELETE FROM canonical_fields WHERE short_code = 'date_current_ceo_was_last_verified';
DELETE FROM canonical_fields WHERE short_code = 'date_f&a_beacon_published';
DELETE FROM canonical_fields WHERE short_code = 'date_impact_rating_was_created';
DELETE FROM canonical_fields WHERE short_code = 'date_of_latest_source';
DELETE FROM canonical_fields WHERE short_code = 'date_record_was_created';
DELETE FROM canonical_fields WHERE short_code = 'date_record_was_published';
DELETE FROM canonical_fields WHERE short_code = 'date_the_donor_advisory_went_live';
DELETE FROM canonical_fields WHERE short_code = 'did_they_pass_audit_review_metric';
DELETE FROM canonical_fields WHERE short_code = 'did_they_pass_board_minutes_metric';
DELETE FROM canonical_fields WHERE short_code = 'did_they_pass_board_ratio_metric';
DELETE FROM canonical_fields WHERE short_code = 'did_they_pass_board_size_metric';
DELETE FROM canonical_fields WHERE short_code = 'did_they_pass_conflict_of_interest_metric';
DELETE FROM canonical_fields WHERE short_code = 'did_they_pass_document_retention_metric';
DELETE FROM canonical_fields WHERE short_code = 'did_they_pass_url_on_990_metric';
DELETE FROM canonical_fields WHERE short_code = 'did_they_pass_whistleblower_metric';
DELETE FROM canonical_fields WHERE short_code = 'do_they_have_a_compliation_or_review';
DELETE FROM canonical_fields WHERE short_code = 'do_they_have_a_conflict_of_interest_policy';
DELETE FROM canonical_fields WHERE short_code = 'do_they_have_a_document_retention_policy';
DELETE FROM canonical_fields WHERE short_code = 'do_they_have_an_audit';
DELETE FROM canonical_fields WHERE short_code = 'do_they_have_a_whistleblower_policy';
DELETE FROM canonical_fields WHERE short_code = 'do_they_have_board_minutes';
DELETE FROM canonical_fields WHERE short_code = 'end_date_for_the_time_period_covered_by_this_tax_form_for_the_rated_fiscal_year';
DELETE FROM canonical_fields WHERE short_code = 'fiscal_year_of_financial_rating';
DELETE FROM canonical_fields WHERE short_code = 'fundraising_efficiency_amount';
DELETE FROM canonical_fields WHERE short_code = 'fundraising_efficiency_score';
DELETE FROM canonical_fields WHERE short_code = 'fundraising_expense_ratio';
DELETE FROM canonical_fields WHERE short_code = 'fundraising_expense_score';
DELETE FROM canonical_fields WHERE short_code = 'if_it_is_cost_effective_highly_cost_effective_or_not_cost_effective';
DELETE FROM canonical_fields WHERE short_code = 'how_they_calculated_counterfactual_';
DELETE FROM canonical_fields WHERE short_code = 'impact_and_results_score';
DELETE FROM canonical_fields WHERE short_code = 'impact_calcuation';
DELETE FROM canonical_fields WHERE short_code = 'is_their_url_listed_on_the_990';
DELETE FROM canonical_fields WHERE short_code = 'is_there_a_donor_advisory_on_this_charity';
DELETE FROM canonical_fields WHERE short_code = 'is_this_an_overall_encompass_passing_rating';
DELETE FROM canonical_fields WHERE short_code = 'is_this_rating_eligible_for_publishing';
DELETE FROM canonical_fields WHERE short_code = 'leadership_metrics_external_focus_score';
DELETE FROM canonical_fields WHERE short_code = 'leadership_metrics_investment_score';
DELETE FROM canonical_fields WHERE short_code = 'organization_board_members';
DELETE FROM canonical_fields WHERE short_code = 'outcome_metric_measures';
DELETE FROM canonical_fields WHERE short_code = 'overall_adaptablity_score';
DELETE FROM canonical_fields WHERE short_code = 'overal_leadership_score';
DELETE FROM canonical_fields WHERE short_code = 'overall_encompass_score_decimal';
DELETE FROM canonical_fields WHERE short_code = 'overall_encompass_score_rounded';
DELETE FROM canonical_fields WHERE short_code = 'overall_rating';
DELETE FROM canonical_fields WHERE short_code = 'overall_score';
DELETE FROM canonical_fields WHERE short_code = 'overall_strategy_score';
DELETE FROM canonical_fields WHERE short_code = 'primary_revenue_growth_score';
DELETE FROM canonical_fields WHERE short_code = 'program_categories';
DELETE FROM canonical_fields WHERE short_code = 'program_expense_growth_score';
DELETE FROM canonical_fields WHERE short_code = 'program_expense_ratio';
DELETE FROM canonical_fields WHERE short_code = 'program_expense_score';
DELETE FROM canonical_fields WHERE short_code = 'proposal_fiscal_sponsor_cantact_last_name';
DELETE FROM canonical_fields WHERE short_code = 'rating_in_the_a&t_dimension';
DELETE FROM canonical_fields WHERE short_code = 'rating_in_the_results_dimension';
DELETE FROM canonical_fields WHERE short_code = 'rating_year';
DELETE FROM canonical_fields WHERE short_code = 'rounded_cc_score_to_remove_decimals';
DELETE FROM canonical_fields WHERE short_code = 'rounded_total_score_for_fa';
DELETE FROM canonical_fields WHERE short_code = 'score_for_goals_score';
DELETE FROM canonical_fields WHERE short_code = 'score_for_mission_statement';
DELETE FROM canonical_fields WHERE short_code = 'score_for_vision_statement';
DELETE FROM canonical_fields WHERE short_code = 'score_in_the_a&t_dimension';
DELETE FROM canonical_fields WHERE short_code = 'score_in_the_financial_dimension';
DELETE FROM canonical_fields WHERE short_code = 'score_in_the_results_dimension';
DELETE FROM canonical_fields WHERE short_code = 'summary_of_the_activities';
DELETE FROM canonical_fields WHERE short_code = 'text_of_the_donor_advisory_message_in_html';
DELETE FROM canonical_fields WHERE short_code = 'the_arithmetic_for_the_cost_calculation';
DELETE FROM canonical_fields WHERE short_code = 'total_accountability_score';
DELETE FROM canonical_fields WHERE short_code = 'total_finace_score';
DELETE FROM canonical_fields WHERE short_code = 'total_leadership_and_adaptablity_score';
DELETE FROM canonical_fields WHERE short_code = 'total_points_avaiable_in_encompass';
DELETE FROM canonical_fields WHERE short_code = 'web_location_of_proforma_990s_to_handle_pharmaceutical_valuation_adjustments';
DELETE FROM canonical_fields WHERE short_code = 'what_is_the_overall_cc_score';
DELETE FROM canonical_fields WHERE short_code = 'what_is_the_percent_of_their_independant_board';
DELETE FROM canonical_fields WHERE short_code = 'when_was_this_overall_rating_created';
DELETE FROM canonical_fields WHERE short_code = 'who_they_serve';
DELETE FROM canonical_fields WHERE short_code = 'working_capital_ratio';
DELETE FROM canonical_fields WHERE short_code = 'working_capital_score';
DELETE FROM canonical_fields WHERE short_code = 'yes_no_indicator_this_rating_is_a_donor_advisory';

-- Add new fields. Generated from 2023-04-19 base fields sheet
INSERT INTO canonical_fields (label, short_code, data_type) VALUES
('Organization Location', 'organization_location', '{ "type": "string" }' ),
('Proposal Additional Contact Name', 'proposal_additional_contact_name', '{ "type": "string" }' ),
('EIN Foreign Entities', 'ein_foreign_entities', '{ "type": "string" }' ),
('Proposal Fiscal Sponsor Location', 'proposal_fiscal_sponsor_location', '{ "type": "string" }' ),
('Proposal Fiscal Sponsor Signatory', 'proposal_fiscal_sponsor_signatory', '{ "type": "string" }' ),
('Authorized Banking Contacts', 'authorized_banking_contacts', '{ "type": "string" }' ),
('Organization Information Change', 'organization_information_change', '{ "type": "string" }' ),
('Updated Contact Information', 'updated_contact_information', '{ "type": "string" }' ),
('Significant Other Funders', 'significant_other_funders', '{ "type": "string" }' ),
('Organization Overview', 'organization_overview', '{ "type": "string" }' ),
('Proposal Context', 'proposal_context', '{ "type": "string" }' ),
('Proposal Leadership', 'proposal_leadership', '{ "type": "string" }' ),
('Proposal Learning and Evaluation', 'proposal_learning_and_evalution', '{ "type": "string" }' ),
('Proposal Past Performance', 'proposal_past_performance', '{ "type": "string" }' ),
('Steps to Prevent Illegal Activity', 'steps_to_prevent_illegal_activity', '{ "type": "string" }' ),
('Proposal Funds Support Unsupervised Entities', 'proposal_funds_support_unsupervised_entities', '{ "type": "boolean" }' ),
('Proposal Funds Support Scholarships or Awards', 'proposal_funds_support_scholarships_or_awards', '{ "type": "boolean" }' ),
('Proposal Funds Support Scholarships or Awards Explanation', 'proposal_funds_support_scholarships_or_awards_explanation', '{ "type": "string" }' ),
('Proposal Payments to Non-Employees', 'proposal_payments_to_non_employees', '{ "type": "boolean" }' ),
('Proposal Payments to Non-Employees Explanation', 'proposal_payments_to_non_employees_explanation', '{ "type": "string" }' ),
('Proposal Location of Work 2', 'proposal_location_of_work_2', '{ "type": "string" }' ),
('Proposal Funds Locations Under US Sanction', 'proposal_funds_locations_under_us_sanction', '{ "type": "boolean" }' ),
('Proposal Funds Locations Under US Sanction Explanation', 'proposal_funds_locations_under_us_sanction_explanation', '{ "type": "string" }' ),
('Proposal Supports Research', 'proposal_supports_research', '{ "type": "boolean" }' ),
('Proposal Involves Desk Research', 'proposal_involves_desk_research', '{ "type": "boolean" }' ),
('Proposal Collects New Data from Individuals', 'proposal_collects_new_data_from_individuals', '{ "type": "boolean" }' ),
('Proposal Collects Personal Data', 'proposal_collects_personal_data', '{ "type": "boolean" }' ),
('Proposal Collects New or Personal Data Explanation', 'proposal_collects_new_or_personal_data_explanation', '{ "type": "string" }' ),
('Proposal Research Will be Published', 'proposal_research_will_be_published', '{ "type": "boolean" }' ),
('Organization has Human Subjects Research Policy', 'organization_has_human_subjects_research_policy', '{ "type": "boolean" }' ),
('Proposal Research Involves Minors', 'proposal_research_involves_minors', '{ "type": "boolean" }' ),
('Organization has Child Protection Policy', 'organization_has_child_protection_policy', '{ "type": "boolean" }' ),
('Proposal Funds Fiscal Agent Duties Research or Conference', 'proposal_funds_fiscal_agent_duties_research_or_conference', '{ "type": "boolean" }' ),
('Proposal Funds Fiscal Agent Duties Research or Conference Explanation', 'proposal_funds_fiscal_agent_duties_research_or_conference_explanation', '{ "type": "string" }' ),
('Additional Information From Applicant', 'additional_information_from_applicant', '{ "type": "string" }' ),
('Organization Articles of Incorporation Document', 'organization_articles_of_incorporation_document', '{ "type": "uri" }' ),
('Organization Child Protection Policy Document', 'organization_child_protection_policy_document', '{ "type": "uri" }' ),
('Organization Conflict of Interest Policy Document', 'organization_conflict_of_interest_policy_document', '{ "type": "uri" }' ),
('Organization Human Subjects Research Policy Document', 'organization_human_subjects_research_policy_document', '{ "type": "uri" }' ),
('Organization IRS Tax Letter Document', 'organization_irs_tax_letter_document', '{ "type": "uri" }' ),
('Organization Latest Unaudited Financial Statement Document', 'organization_latest_unaudited_financial_statement_document', '{ "type": "uri" }' ),
('Organization Charter Document', 'organization_charter_document', '{ "type": "uri" }' ),
('Organization Policy Regarding Data Gathering from Children Document', 'organization_policy_regarding_data_gathering_from_children_document', '{ "type": "uri" }' ),
('Organization Whistleblower Policy Document', 'organization_whistleblower_policy_document', '{ "type": "uri" }' ),
('Organization Latitude EPSG:4326', 'organization_latitude_epsg_4326', '{ "type": "number" }' ),
('Organization Longitude EPSG:4326', 'organization_longitude_epsg_4326', '{ "type": "number" }' ),
('Organization Neighborhood', 'organization_neighborhood', '{ "type": "string" }' ),
('Proposal Abstract', 'proposal_abstract', '{ "type": "string" }' ),
('Proposal Purpose Statement', 'proposal_purpose_statement', '{ "type": "string" }' ),
('Proposal Agreement with Fiscal Agent Docume', 'proposal_agreement_with_fiscal_agent_document', '{ "type": "uri" }' );
