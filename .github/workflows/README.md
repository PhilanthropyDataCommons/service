# GitHub Workflow Notes for the Philanthropy Data Commons service

## Deploy

The deploy task requires an API key, secret `DIGITAL_OCEAN_TOKEN`, and an
environment with a variable `DIGITAL_OCEAN_APP_ID`. The App ID is a UUID.

In order for `@dependabot merge` to access `DIGITAL_OCEAN_TOKEN`, it needs to be
added to the repository secrets in the dependabot area in addition to the
actions area (see repository Settings -> Security -> Secrets and Variables).
The Digital Ocean API token does not vary by environment because both Test and
Production run on Digital Ocean App Platforms. To generate such a token, visit
https://cloud.digitalocean.com/account/api/tokens and create a token with access
to Create, Read, and Update Apps.

The `DIGITAL_OCEAN_APP_ID` varies by environment. It is specified in the
repository Settings -> Code and automation -> Environments area, one per each.
The App ID can be found in the URL of the Digital Ocean cloud management
interface for the Test or Production App.

The reason the deploy task pipes to `jq` is twofold:

1. It filters out secrets by selecting a single expected deployment id.
2. It helps return an error when there is no expected deployment id (`-e`).

## Previews

The previews tasks create (and destroy) a single DO App per pull request.

### Tokens

Do not paste the Digital Ocean API token used for previews in GitHub.

Previews requires several secrets and variables which can be seen in-band. They
usually have `DEPLOY_PREVIEWS` in the name to flag them for this use case.

What cannot be seen in-band is the proxy server that holds a distinct DO API
token that is not intended to touch Production, Sandbox, Demo, or Test
environments. Since DO does not issue environment-specific or app-specific
tokens, and because this preview capability needs to delete Apps, the DO API
token has the ability to destroy the production app. Observe that the token
actually used to deploy to production and housed in GH, does **not** have
delete access. To grant the previews tasks the ability to destroy a preview app
while preventing the destruction of the production app, a proxy server filters
out requests with UUIDs in the path associated with Production, Sandbox, Demo,
or Test environments while proxying other requests to the DO API when the path
prefix is one that indicates the DO API. The proxy configuration includes a
separate secret token that grants the ability to call this proxy server. If the
Bearer token does not match that of the proxy configuration, the request is
rejected. See the below example.

An example `nginx` configuration with placeholder UUIDs, server name, tokens:

```nginx
map $request_uri $reject_uri {
    # Reject production app UUIDs anywhere in the URI
    ~*a337e38a-9839-482d-855f-deb31a2084b5 1; # important app one...
    ~*0f4a4257-68b5-4d1a-8451-c037d4430b0d 1; # important app N
    # Allow "/v2/apps*" calls
    ~*^\/v2\/apps 0;
    # Reject everything else
    default 1;
}

server {

    server_name do.token.custodian.server; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/do.token.custodian.server/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/do.token.custodian.server/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

    location / {
        # Validate the secret that GH actions use to reach this server.
        if ($http_authorization != "Bearer SOME_RANDOM_STRING_HERE") {
            return 401;
	}
	if ($reject_uri) {
	   return 403;
	}

        proxy_pass https://api.digitalocean.com;

	# Replace the authorization header with our DO secret here.
	proxy_set_header Authorization "Bearer dop_v1_ACTUAL_DO_TOKEN_HERE";

	# The usual proxy headers follow. But Digital Ocean and/or Cloudflare don't like these.
	#proxy_set_header Host $http_host;
	#proxy_set_header X-Real-IP $remote_addr;
	#proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	#proxy_set_header X-Forwarded-Proto $scheme;
    }

}
server {
    if ($host = do.token.custodian.server) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


	listen 80 ;
	listen [::]:80 ;
    server_name do.token.custodian.server;
    return 404; # managed by Certbot


}
```

It is anticipated that this will be replaced by a Caddyfile, but `nginx` is
used as of this writing and sufficiently demonstrates the concept.

### Database

The previews databases are held in a single, managed DO PostgreSQL cluster.
This differs from other environments that each have a separate cluster. The
reason is to save time (setup, teardown) and money. It also means we don't need
to call the DO API for database setup and teardown, we can use `psql`. Another
benefit is we can (and do) use a fork of the sandbox database as a template.

### S3

The previews share a single S3 bucket in DO spaces. This differs from other
environments that each have a separate bucket. Automatic bucket creation did not
lend itself to automation and also required several more DO token privileges.
Before tearing down the database, a task looks in the database for created files
and their keys and attempts to remove them individually from the bucket.

### App

The previews apps are deployed in much the same way as production. First, a
docker image is built, pushed to GHCR.io, and tagged. Second, an App Spec that
references this new docker image is sent via DO API to create or update an app.
