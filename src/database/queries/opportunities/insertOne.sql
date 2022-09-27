INSERT INTO opportunities ( title ) VALUES ( :title )
RETURNING id AS "id",
  title as "title",
  created_at as "createdAt";
