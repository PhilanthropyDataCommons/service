SELECT ephemeral_auth_context_to_json(ephemeral_auth_contexts.*) AS object
FROM ephemeral_auth_contexts
WHERE token_id = system_ephemeral_auth_context_token_id();
