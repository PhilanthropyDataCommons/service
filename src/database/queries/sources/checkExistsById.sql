SELECT EXISTS(
  SELECT 1
    FROM sources
    WHERE id = :sourceId
) AS result;
