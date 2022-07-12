create table applicants (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone not null default now(),
  external_id varchar not null,
  opted_in boolean not null default false
);

comment on table applicants is
  'Applicants submit applications for (funding) opportunities.';
comment on column applicants.external_id is
  'The external identifier, not necessarily unique across organizations.';
