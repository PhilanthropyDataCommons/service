SELECT drop_function('initiative_to_json');

CREATE FUNCTION initiative_to_json(initiative initiatives)
RETURNS jsonb AS $$
	SELECT jsonb_build_object(
		'id', initiative.id,
		'changemakerId', initiative.changemaker_id,
		'title', initiative.title,
		'createdAt', initiative.created_at,
		'createdBy', initiative.created_by
	);
$$ LANGUAGE sql IMMUTABLE;
