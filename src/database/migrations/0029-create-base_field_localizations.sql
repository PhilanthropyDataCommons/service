CREATE TABLE base_field_localizations (
  base_field_id INTEGER NOT NULL,
  language VARCHAR NOT NULL,
  label VARCHAR NOT NULL,
  description VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (base_field_id, language),
  FOREIGN KEY (base_field_id) REFERENCES base_fields(id)
);

COMMENT ON TABLE base_field_localizations IS
  'Localizations for base field labels';

INSERT INTO base_field_localizations (base_field_id, language, label, description)
SELECT id, 'en', label, description
FROM base_fields;

ALTER TABLE base_fields DROP COLUMN label, DROP COLUMN description;
