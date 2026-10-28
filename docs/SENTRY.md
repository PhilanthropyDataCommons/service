# Sentry

The PDC service reports unexpected errors to [Sentry], so that the team learns
about failures before PDC users have to report them.

[Sentry]: https://sentry.io

## What Is Reported

- Requests that fail with a server error (5xx).
- Crashes and unhandled errors.
- Failures to start the service, run database migrations, or keep the
  background job queue running.

Requests the service correctly rejects (4xx), such as invalid input or missing
permissions, are not reported.

## Environments

Every deployment reports to the `pdc-service` project in the
`philanthropy-data-commons` Sentry organization. Each report is tagged with the
environment it came from, matching the PDC [environments]:

| Environment  | API                                       | Used for                               |
| ------------ | ----------------------------------------- | -------------------------------------- |
| `production` | `api.philanthropydatacommons.org`         | Real PDC users and data.               |
| `demo`       | `api.demo.philanthropydatacommons.org`    | Demonstrating PDC capabilities.        |
| `sandbox`    | `api.sandbox.philanthropydatacommons.org` | Testing integrations with the PDC API. |
| `test`       | `api.test.philanthropydatacommons.org`    | Internal testing; may be broken.       |
| `local`      | A developer's machine                     | Shown in Spotlight only; never sent.   |

Errors in `production` affect PDC users directly; errors in the other
environments usually do not. Preview deployments do not report to Sentry.

[environments]: https://github.com/PhilanthropyDataCommons/meta/blob/main/INSTANCES.md

## Tags

PDC does not add tags of its own. The ones Sentry adds that matter most when
reading a report are:

- `environment`: the environment above. Filter on `environment:production` to
  see only what PDC users are affected by.
- `handled`: `yes` for errors the service caught and reported, such as a 5xx
  response or a failed migration; `no` for crashes.
- `server_name`: the host name of the container that sent the report.

## What Data Is Shared

The PDC holds sensitive changemaker, funder, and proposal data, so reports carry
only what is needed to find a bug: the error, its stack trace, and the request
method and path. They do not include request bodies, query strings, cookies,
PDC users' IP addresses or other user information, or the values of request
headers other than `content-type`, `content-length`, and `user-agent`. When
something other than an error is thrown, reports name its keys but not its
values. Sentry does record an approximate location for each report, based on
the address of the PDC server that sent it.

## Configuring a Deployment

Set these on each deployment's DigitalOcean app, as environment variables of
its `service` component:

- `SENTRY_DSN`: the `pdc-service` project's client key. Sentry is off when it
  is unset.
- `SENTRY_ENVIRONMENT`: the deployment's name from the list above. Always set
  it alongside `SENTRY_DSN`; without it, reports are filed under `production`.

## Local Development

Never set `SENTRY_DSN` locally. To see errors the way Sentry would, without
sending them anywhere, use [Spotlight]:

1. Run `npx @spotlightjs/spotlight` and open `http://localhost:8969`.
2. Set `SENTRY_SPOTLIGHT=1`.
3. Run `npm run start` or `npm run migrate` as usual.

Any new entry point must import `src/instrument.ts` first, as `src/index.ts`
does.

[Spotlight]: https://spotlightjs.com/docs/getting-started/
