SELECT drop_function('funder_collaborative_invitation_to_json');

CREATE FUNCTION funder_collaborative_invitation_to_json(
	funder_collaborative_invitation funder_collaborative_invitations
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'funderCollaborativeShortCode', funder_collaborative_invitation.funder_collaborative_short_code,
    'invitedFunderShortCode', funder_collaborative_invitation.invited_funder_short_code,
    'invitationStatus', funder_collaborative_invitation.invitation_status,
    'createdBy', funder_collaborative_invitation.created_by,
    'createdAt', funder_collaborative_invitation.created_at
  );
END;
$$ LANGUAGE plpgsql;
