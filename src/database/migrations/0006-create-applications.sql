create table applications (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone not null default now(),
  opportunity_id bigint not null
    references opportunities (id) on delete cascade,
  applicant_id bigint not null
    references applicants (id) on delete cascade
);

comment on table applications is
  'A submission to an opportunity for funding.';
