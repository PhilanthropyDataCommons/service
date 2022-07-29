SELECT o.id AS "opportunityId",
  o.title AS "opportunityTitle",
  o.created_at AS "opportunityCreatedAt",
  aps.id AS "applicationSchemaId",
  aps.version AS "applicationSchemaVersion",
  aps.created_at AS "applicationSchemaCreatedAt",
  apsf.id AS "applicationSchemaFieldId",
  apsf.label AS "applicationSchemaFieldLabel",
  apsf.position AS "applicationSchemaFieldPosition",
  apsf.created_at AS "applicationSchemaFieldCreatedAt",
  cf.id AS "canonicalFieldId",
  cf.label AS "canonicalFieldLabel",
  cf.short_code AS "canonicalFieldShortCode",
  cf.data_type AS "canonicalFieldDataType",
  cf.created_at AS "canonicalFieldCreatedAt"
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
  ON cf.id = apsf.canonical_field_id
-- We could order by position, etc., but we leave that to callers/clients/GUIs.
-- There is exactly one canonical field per application schema field, therefore
-- we do not need to further order by the cf.id.
ORDER BY o.id, aps.id, apsf.id;
