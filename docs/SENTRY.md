# Sentry

The PDC service can report unexpected errors to [Sentry]. It is off unless
`SENTRY_DSN` is set.

[Sentry]: https://sentry.io

## Configuring a Deployment

Set these on each deployment's DigitalOcean app, as environment variables of
its `service` component:

- `SENTRY_DSN`: the Sentry project's client key.
- `SENTRY_ENVIRONMENT`: the deployment's [environment] name, such as
  `production` or `sandbox`. Always set it alongside `SENTRY_DSN`; without it,
  reports are filed under `production`.

[environment]: https://github.com/PhilanthropyDataCommons/meta/blob/main/INSTANCES.md

`src/sentry.ts` limits what Sentry collects. Sentry collects any kind of
data that file does not mention, so check Sentry's release notes for new kinds
of data whenever `@sentry/node` is upgraded.

## Local Development

Don't set `SENTRY_DSN` locally. To see errors the way Sentry would, without
sending them anywhere, use [Spotlight]:

1. Run `npx @spotlightjs/spotlight` and open `http://localhost:8969`.
2. Set `SENTRY_SPOTLIGHT=1`.
3. Run `npm run start` or `npm run migrate` as usual.

Any new entry point must call `initSentry()` before doing anything else, as
`src/index.ts` does.

[Spotlight]: https://spotlightjs.com/docs/getting-started/
