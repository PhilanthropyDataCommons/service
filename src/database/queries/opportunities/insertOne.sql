INSERT INTO opportunities (title) VALUES (:title)
RETURNING opportunity_to_json(opportunities) AS object;
