SELECT proposal_to_json(proposals.*) as object
  FROM proposals
  WHERE id = :id;
