SELECT EXISTS (
  SELECT 1 FROM proposals where id = :id
) AS result
