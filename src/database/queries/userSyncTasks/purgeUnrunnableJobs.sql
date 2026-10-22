-- Reaches into graphile-worker internals under the default worker schema
-- ('graphile_worker'); an upgrade changing these tables breaks this
-- loudly. The 4 hours mirrors graphile-worker's own stale-lock window
-- (its default job_expiry).
DELETE FROM graphile_worker._private_jobs AS jobs
USING graphile_worker._private_tasks AS tasks
WHERE
	jobs.task_id = tasks.id
	AND tasks.identifier = 'syncUsersFromKeycloak'
	AND jobs.attempts >= jobs.max_attempts
	AND (
		jobs.locked_at IS NULL
		OR jobs.locked_at < now() - interval '4 hours'
	);
