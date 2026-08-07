CREATE INDEX permission_grants_funder_context_idx
ON permission_grants (funder_short_code)
WHERE context_entity_type = 'funder';

CREATE INDEX permission_grants_changemaker_context_idx
ON permission_grants (changemaker_id)
WHERE context_entity_type = 'changemaker';
