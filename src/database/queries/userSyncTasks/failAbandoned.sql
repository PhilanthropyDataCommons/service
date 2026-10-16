UPDATE user_sync_tasks AS task
SET
	status = 'failed',
	status_updated_at = now()
WHERE
	task.status IN ('pending', 'in_progress')
	AND task.id <> :userSyncTaskId::integer
	AND NOT EXISTS (
		SELECT 1
		FROM graphile_worker._private_jobs AS jobs
			INNER JOIN graphile_worker._private_tasks AS tasks ON jobs.task_id = tasks.id
		WHERE
			tasks.identifier = 'syncUsersFromKeycloak'
			AND jobs.payload ->> 'userSyncTaskId' = task.id::text
			AND (
				jobs.attempts < jobs.max_attempts
				OR (
					jobs.locked_at IS NOT NULL
					AND jobs.locked_at >= now() - interval '4 hours'
				)
			)
	)
RETURNING
	task.id;
