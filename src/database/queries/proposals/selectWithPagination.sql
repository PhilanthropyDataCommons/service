SELECT p.id AS "proposal_id",
  p.applicant_id AS "proposal_applicantId",
  p.external_id AS "proposal_externalId",
  p.opportunity_id AS "proposal_opportunityId",
  p.created_at AS "proposal_createdAt",
  pv.id AS "proposalVersion_id",
  pv.proposal_id AS "proposalVersion_proposalId",
  pv.application_form_id AS "proposalVersion_applicationFormId",
  pv.version AS "proposalVersion_version",
  pv.created_at AS "proposalVersion_createdAt",
  pfv.id AS "proposalFieldValue_id",
  pfv.proposal_version_id AS "proposalFieldValue_proposalVersionId",
  pfv.application_form_field_id AS "proposalFieldValue_applicationFormFieldId",
  pfv.value AS "proposalFieldValue_value",
  pfv.position AS "proposalFieldValue_position",
  pfv.created_at AS "proposalFieldValue_createdAt",
  aff.id as "applicationFormField_id",
  aff.application_form_id as "applicationFormField_applicationFormId",
  aff.canonical_field_id as "applicationFormField_canonicalFieldId",
  aff.position as "applicationFormField_position",
  aff.label as "applicationFormField_label",
  aff.created_at as "applicationFormField_createdAt"
FROM proposals p
  LEFT JOIN proposal_versions pv on pv.proposal_id = p.id
  LEFT JOIN proposal_field_values pfv on pfv.proposal_version_id = pv.id
  LEFT JOIN application_form_fields aff on pfv.application_form_field_id = aff.id
WHERE p.id = ANY(
  SELECT inner_p.id
  FROM proposals inner_p
  ORDER BY inner_p.id DESC
  OFFSET :offset FETCH NEXT :limit ROWS ONLY
)
ORDER BY p.id DESC
