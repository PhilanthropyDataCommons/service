SELECT o.id AS "id",
  o.title AS "title",
  o.created_at AS "createdAt"
FROM opportunities o
WHERE o.id = :id;
