SELECT proposal_to_json(proposals.*) AS object
FROM proposals
WHERE id = :proposalId;
