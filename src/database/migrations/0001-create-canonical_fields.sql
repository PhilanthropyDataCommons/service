create table canonical_fields (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone not null default now(),
  label varchar not null,
  short_code varchar not null,
  field_type varchar not null
);

comment on table canonical_fields is
  'Canonical fields are those fields that are unique across organizations.';
comment on column canonical_fields.label is 'The description of the field';
comment on column canonical_fields.short_code is 'The short name of the field';
comment on column canonical_fields.field_type is 'The data type of the field';
