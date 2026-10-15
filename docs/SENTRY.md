# Sentry

The PDC service reports unexpected errors to [Sentry], so that the team learns
about server errors before a PDC user has to report them.

Sentry is optional. When `SENTRY_DSN` is unset, nothing is sent. Local
development and the test suite run this way.

[Sentry]: https://docs.sentry.io/platforms/javascript/guides/node/

## Configuration

| Variable             | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `SENTRY_DSN`         | The Sentry project's client key. Leave unset to disable Sentry.    |
| `SENTRY_ENVIRONMENT` | The deployment's name: `test`, `demo`, `sandbox`, or `production`. |

Each deployment reports to the same Sentry project, `pdc-service`, and is told
apart by `SENTRY_ENVIRONMENT`.

## What Is Reported

- **Server errors**: any request that `errorHandler` answers with a 5xx status.
- **Crashes**: uncaught exceptions and unhandled promise rejections.
- **Startup failures**: errors that stop the service from starting.
- **Job queue failures**: errors that stop the Graphile Worker runner.

Client errors (4xx responses) are not reported. They mean the service rejected
a bad request, which is expected behavior.

## How It Works

`src/instrument.ts` initializes Sentry. It has to run before any other module
loads, so `docker-entrypoint.sh` preloads it with `node --import`.

`errorHandler` already decides which errors are server errors, so it is the
only place that reports request errors to Sentry. Sentry's own Express error
capture is turned off, because it determines the status from the error object
and PDC errors such as `NotFoundError` do not carry one; left on, it would
report 4xx responses too.

## Data Sent to Sentry

Requests to the PDC carry changemaker, funder, and proposal data, some of it
sensitive. `src/instrument.ts` therefore sets `dataCollection` explicitly
instead of using the SDK's defaults, which collect most request data. Events
include the error, its stack trace, the request method and path, and the
`content-type`, `content-length`, and `user-agent` headers. They do not include
request bodies, query strings, cookies, other headers, IP addresses, database
query parameters, or the values of local variables.
