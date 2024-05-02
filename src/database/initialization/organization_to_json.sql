CREATE OR REPLACE FUNCTION organization_to_json(organization organizations)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'id', organization.id,
    'taxId', organization.tax_id,
    'employerIdentificationNumber', organization.tax_id,
    'name', organization.name,
    'createdAt', organization.created_at
  );
END;
$$ LANGUAGE plpgsql;
