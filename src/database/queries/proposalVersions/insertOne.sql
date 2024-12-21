INSERT INTO proposal_versions (
	proposal_id,
	application_form_id,
	source_id,
	created_by,
	version
) VALUES (
	:proposalId,
	:applicationFormId,
	:sourceId,
	:createdBy,
	coalesce(
		(
			SELECT max(pv.version) + 1
			FROM proposal_versions AS pv
			WHERE pv.proposal_id = :proposalId
		),
		1
	)
)
RETURNING proposal_version_to_json(proposal_versions) AS object;
