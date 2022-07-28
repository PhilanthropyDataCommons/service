create table application_versions (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone not null default now(),
  application_id bigint not null
    references applications (id) on delete cascade,
  application_schema_id bigint not null
    references application_schemas (id) on delete cascade,
  version int not null,
  constraint unique_application_id_version unique (application_id, version)
);

comment on table application_versions is
  'One instance or version of a filled-out application.';
comment on column application_versions.application_schema_id is
  'The application schema for which this application was filled out.';
comment on column application_versions.version is
  'When there are updates to an application, higher versions are used.';
