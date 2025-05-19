SELECT drop_function('funder_collaborative_member_to_json');

CREATE FUNCTION funder_collaborative_member_to_json(
	funder_collaborative_member funder_collaborative_members
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'funderCollaborativeShortCode', funder_collaborative_member.funder_collaborative_short_code,
    'memberFunderShortCode', funder_collaborative_member.member_funder_short_code,
    'createdBy', funder_collaborative_member.created_by,
    'createdAt', funder_collaborative_member.created_at
  );
END;
$$ LANGUAGE plpgsql;
