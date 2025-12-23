CREATE TABLE changemaker_field_value_batches (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	source_id integer NOT NULL,
	notes text,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	CONSTRAINT fk_source
	FOREIGN KEY (source_id)
	REFERENCES sources (id)
	ON DELETE RESTRICT
);

COMMENT ON TABLE changemaker_field_value_batches IS
'Represents a batch of changemaker field values from an external source.';

CREATE INDEX idx_changemaker_field_value_batches_source
ON changemaker_field_value_batches (source_id);

CREATE INDEX idx_changemaker_field_value_batches_created_at
ON changemaker_field_value_batches (created_at);
