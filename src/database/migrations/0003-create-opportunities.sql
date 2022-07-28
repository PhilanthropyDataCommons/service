create table opportunities (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone not null default now(),
  title varchar not null
);

comment on table opportunities is
  'Funding opportunities such as available grants or awards.';
comment on column opportunities.title is
  'The external identifier; not necessarily unique across organizations.';
