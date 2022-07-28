SELECT o.id AS "opportunityId",
  o.title AS "opportunityTitle",
  aps.id AS "applicationSchemaId",
  aps.version AS "applicationSchemaVersion",
  apsf.label AS "applicationSchemaFieldLabel",
  cf.label AS "canonicalFieldLabel"
FROM opportunities o
INNER JOIN application_schemas aps
  ON o.id = aps.opportunity_id
INNER JOIN (
  SELECT aps2.opportunity_id AS opportunityId,
    MAX(aps2.version) AS maxApplicationSchemaVersion
  FROM application_schemas aps2
  GROUP BY aps2.opportunity_id
) filteredAppSchemas
  ON o.id = filteredAppSchemas.opportunityId
    AND aps.version = filteredAppSchemas.maxApplicationSchemaVersion
INNER JOIN application_schema_fields apsf
  ON aps.id = apsf.application_schema_id
INNER JOIN canonical_fields cf
  ON cf.id = apsf.canonical_field_id;
