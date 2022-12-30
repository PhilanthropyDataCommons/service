SELECT p.id AS "id",
  p.applicant_id AS "applicantId",
  p.opportunity_id AS "opportunityId",
  p.external_id AS "externalId",
  p.created_at AS "createdAt",
  pv.id AS "proposalVersionId",
  pv.application_form_id AS "proposalVersionApplicationFormId",
  pv.version AS "proposalVersionVersion",
  pv.created_at AS "proposalVersionCreatedAt",
  pfv.id as "proposalFieldValueId",
  pfv.application_form_field_id AS "proposalFieldValueApplicationFormFieldId",
  pfv.value AS "proposalFieldValueValue",
  pfv.position AS "proposalFieldValuePosition",
  pfv.created_at AS "proposalFieldValueCreatedAt",
  aff.canonical_field_id AS "applicationFormFieldCanonicalFieldId",
  aff.position AS "applicationFormFieldPosition",
  aff.label AS "applicationFormFieldLabel",
	aff.created_at AS "applicationFormFieldCreatedAt"
FROM proposals p
LEFT OUTER JOIN proposal_versions pv
  ON pv.proposal_id = p.id
LEFT OUTER JOIN proposal_field_values pfv
  ON pfv.proposal_version_id = pv.id
LEFT OUTER JOIN application_form_fields aff
  ON pfv.application_form_field_id = aff.id
WHERE p.id = :id
ORDER BY pv.version DESC, pfv.position, aff.position;
