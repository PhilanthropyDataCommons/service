-- Returns TRUE when `verb` is in `verbs`, or when `verbs` contains 'manage'
-- (a granted 'manage' verb satisfies any verb check).
CREATE OR REPLACE FUNCTION verb_set_permits_verb(
	verbs permission_grant_verb_t [],
	verb permission_grant_verb_t
) RETURNS boolean AS $$
	SELECT verb = ANY(verbs) OR 'manage' = ANY(verbs);
$$ LANGUAGE sql IMMUTABLE;
