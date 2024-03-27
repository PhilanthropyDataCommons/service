CREATE OR REPLACE FUNCTION organization_to_json(organization organizations)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'id', organization.id,
    'employerIdentificationNumber', organization.employer_identification_number,
    'name', organization.name,
    'createdAt', organization.created_at
  );
END;
$$ LANGUAGE plpgsql;
