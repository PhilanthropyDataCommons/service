SELECT o.id AS "id",
  o.employer_identification_number AS "employerIdentificationNumber",
  o.name AS "name",
  o.created_at AS "createdAt"
FROM organizations o
  LEFT JOIN organizations_proposals op on op.organization_id = o.id
WHERE
  CASE
    WHEN :proposalId != 0 THEN
      op.proposal_id = :proposalId
    ELSE
      true
    END
ORDER BY o.id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY
