ALTER TABLE sources
ADD UNIQUE (label, changemaker_id),
ADD UNIQUE (label, funder_short_code),
ADD UNIQUE (label, data_provider_short_code);
