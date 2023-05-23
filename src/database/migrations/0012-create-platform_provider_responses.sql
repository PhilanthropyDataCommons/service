CREATE TABLE platform_provider_responses (
  external_id VARCHAR NOT NULL,
  platform_provider VARCHAR NOT NULL,
  PRIMARY KEY (external_id, platform_provider),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
