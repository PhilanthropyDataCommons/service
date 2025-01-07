SELECT proposal_version_to_json(proposal_versions.*) AS object
FROM proposal_versions
WHERE id = :proposalVersionId;
