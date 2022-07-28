create table application_field_values (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone not null default now(),
  application_version_id bigint not null
    references application_versions (id) on delete cascade,
  application_schema_field_id bigint not null
    references application_schema_fields (id) on delete cascade,
  position int not null default 0,
  field_value varchar not null,
  constraint unique_application_version_id_application_schema_field_id_position
    unique(application_version_id, application_schema_field_id, position)
);

comment on table application_field_values is
  'A filled-out field value in an application.';
comment on column application_field_values.position is
  'When a field allows multiple responses, use additional position values.';
