create table application_schema_fields (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone not null default now(),
  application_schema_id bigint not null
    references application_schemas (id) on delete cascade,
  canonical_field_id bigint not null
    references canonical_fields (id) on delete cascade,
  position int not null,
  label varchar not null,
  constraint unique_application_schema_id_canonical_field_id unique(application_schema_id, canonical_field_id)
);

comment on table application_schema_fields is
  'An available field in an application schema.';
comment on column application_schema_fields.position is
  'The relative order of this field within its application schema.';
comment on column application_schema_fields.label is
  'The name of this field within its application schema. These may vary between application schemas, opportunities, or organizations but many of these may refer to one canonical field.';
