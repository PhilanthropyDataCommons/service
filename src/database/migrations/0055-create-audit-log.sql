-- Adapted from
-- https://github.com/iloveitaly/audit-trigger/blob/a1046331d8073b844/audit.sql
-- under the following license.
--
-- PostgreSQL Audit Trigger Example
-- Copyright (c) 2013, PostgreSQL Global Development Group
--
-- Permission to use, copy, modify, and distribute this software and its
-- documentation for any purpose, without fee, and without a written agreement
-- is hereby granted, provided that the above copyright notice and this
-- paragraph and the following two paragraphs appear in all copies.
--
-- IN NO EVENT SHALL THE UNIVERSITY OF CALIFORNIA BE LIABLE TO ANY PARTY FOR
-- DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING
-- LOST PROFITS, ARISING OUT OF THE USE OF THIS SOFTWARE AND ITS
-- DOCUMENTATION, EVEN IF THE UNIVERSITY OF CALIFORNIA HAS BEEN ADVISED OF THE
-- POSSIBILITY OF SUCH DAMAGE.
--
-- THE UNIVERSITY OF CALIFORNIA SPECIFICALLY DISCLAIMS ANY WARRANTIES,
-- INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY
-- AND FITNESS FOR A PARTICULAR PURPOSE.  THE SOFTWARE PROVIDED HEREUNDER IS
-- ON AN "AS IS" BASIS, AND THE UNIVERSITY OF CALIFORNIA HAS NO OBLIGATIONS TO
-- PROVIDE MAINTENANCE, SUPPORT, UPDATES, ENHANCEMENTS, OR MODIFICATIONS.
-- An audit history is important on most tables. Provide an audit trigger that
-- logs to a dedicated audit table for the major relations.
--
-- This file should be generic and not depend on application roles or
-- structures as it's being listed here:
--
--	https://wiki.postgresql.org/wiki/Audit_trigger_91plus
--
-- This trigger was originally based on
--   http://wiki.postgresql.org/wiki/Audit_trigger
-- but has been completely rewritten.
--
-- Should really be converted into a relocatable EXTENSION, with control and
-- upgrade files.
--
-- Audited data. Lots of information is available, it's just a matter of how
-- much you really want to record. See:
--
--   http://www.postgresql.org/docs/9.1/static/functions-info.html
--
-- Remember, every column you add takes up more audit table space and slows
-- audit inserts.
--
-- Every index you add has a big impact too, so avoid adding indexes to the
-- audit table unless you REALLY need them. The json GIN/GIST indexes are
-- particularly expensive.
--
-- It is sometimes worth copying the audit table, or a coarse subset of it that
-- you're interested in, into a temporary table where you CREATE any useful
-- indexes and do your analysis.
--
CREATE TABLE audit_logs (
	event_id bigserial PRIMARY KEY,
	schema_name text NOT NULL,
	table_name text NOT NULL,
	relid oid NOT NULL,
	session_user_name text,
	action_tstamp_tx timestamp with time zone NOT NULL,
	action_tstamp_stm timestamp with time zone NOT NULL,
	action_tstamp_clk timestamp with time zone NOT NULL,
	transaction_id bigint,
	application_name text,
	client_addr inet,
	client_port integer,
	pid integer,
	client_query text,
	action text NOT NULL CHECK (action IN ('I', 'D', 'U', 'T', 'A', 'S')),
	row_data jsonb,
	changed_fields jsonb,
	statement_only boolean NOT NULL
);
REVOKE ALL ON audit_logs
FROM public;
COMMENT ON TABLE audit_logs IS
'History of auditable actions on audited tables, from '
'audit_if_modified_func()';
COMMENT ON COLUMN audit_logs.event_id IS
'Unique identifier for each auditable event';
COMMENT ON COLUMN audit_logs.schema_name IS
'Database schema audited table for this event is in';
COMMENT ON COLUMN audit_logs.table_name IS
'Non-schema-qualified table name of table event occured in';
COMMENT ON COLUMN audit_logs.relid IS
'Table OID. Changes with drop/create. Get with ''tablename''::regclass';
COMMENT ON COLUMN audit_logs.session_user_name IS
'Login / session user whose statement caused the audited event';
COMMENT ON COLUMN audit_logs.action_tstamp_tx IS
'Transaction start timestamp for tx in which audited event occurred';
COMMENT ON COLUMN audit_logs.action_tstamp_stm IS
'Statement start timestamp for tx in which audited event occurred';
COMMENT ON COLUMN audit_logs.action_tstamp_clk IS
'Wall clock time at which audited event''s trigger call occurred';
COMMENT ON COLUMN audit_logs.transaction_id IS
'Identifier of transaction that made the change. May wrap, but unique paired '
'with action_tstamp_tx.';
COMMENT ON COLUMN audit_logs.client_addr IS
'IP address of client that issued query. Null for unix domain socket.';
COMMENT ON COLUMN audit_logs.client_port IS
'Remote peer IP port address of client that issued query. Undefined for unix '
'socket.';
COMMENT ON COLUMN audit_logs.pid IS
'Session ID aka connection ID aka backend process ID used.';
COMMENT ON COLUMN audit_logs.client_query IS
'Top-level query that caused this auditable event. May be more than one '
'statement.';
COMMENT ON COLUMN audit_logs.application_name IS
'Application name set when this audit event occurred. Can be changed '
'in-session by client.';
COMMENT ON COLUMN audit_logs.action IS
'Action type; I = insert, D = delete, U = update, T = truncate, A = begin '
'auditing changes, S = stop auditing changes (removing the trigger).';
COMMENT ON COLUMN audit_logs.row_data IS
'Record value. Null for statement-level trigger. For INSERT this is the new '
'tuple. For DELETE and UPDATE it is the old tuple.';
COMMENT ON COLUMN audit_logs.changed_fields IS
'New values of fields changed by UPDATE. Null except for row-level UPDATE '
' events.';
COMMENT ON COLUMN audit_logs.statement_only IS
'''t'' if audit event is from an FOR EACH STATEMENT trigger, ''f'' for FOR '
'EACH ROW';
CREATE INDEX audit_logs_relid_idx ON audit_logs (relid);
CREATE INDEX audit_logs_action_tstamp_tx_stm_idx
ON audit_logs (action_tstamp_stm);
CREATE INDEX audit_logs_action_idx ON audit_logs (action);

CREATE OR REPLACE FUNCTION audit_if_modified_func() RETURNS trigger AS $body$
DECLARE
	audit_row audit_logs;
	include_values boolean;
	log_diffs boolean;
	h_old jsonb;
	h_new jsonb;
	excluded_cols text [] = ARRAY []::text [];
	BEGIN IF TG_WHEN <> 'AFTER' THEN RAISE EXCEPTION 'audit_if_modified_func()'
    ' may only run as an AFTER trigger';
END IF;
audit_row = ROW(
	nextval('audit_logs_event_id_seq'),
	-- event_id
	TG_TABLE_SCHEMA::text,
	-- schema_name
	TG_TABLE_NAME::text,
	-- table_name
	TG_RELID,
	-- relation OID for much quicker searches
	session_user::text,
	-- session_user_name
	current_timestamp,
	-- action_tstamp_tx
	statement_timestamp(),
	-- action_tstamp_stm
	clock_timestamp(),
	-- action_tstamp_clk
	txid_current(),
	-- transaction ID
	current_setting('application_name'),
	-- client application
	inet_client_addr(),
	-- client_addr
	inet_client_port(),
	-- client_port
	pg_backend_pid(),
	-- session/connection/process ID
	current_query(),
	-- top-level query or queries (if multistatement) from client
	substring(TG_OP, 1, 1),
	-- action
	NULL,
	NULL,
	-- row_data, changed_fields
	'f' -- statement_only
);
IF NOT TG_ARGV [0]::boolean IS DISTINCT
FROM 'f'::boolean THEN audit_row.client_query = NULL;
END IF;
IF TG_ARGV [1] IS NOT NULL THEN excluded_cols = TG_ARGV [1]::text [];
END IF;
IF (
	TG_OP = 'UPDATE'
	AND TG_LEVEL = 'ROW'
) THEN audit_row.row_data = row_to_json(OLD)::JSONB - excluded_cols;
--Computing differences
SELECT jsonb_object_agg(tmp_new_row.key, tmp_new_row.value) AS new_data
INTO audit_row.changed_fields
FROM jsonb_each_text(row_to_json(NEW)::JSONB) AS tmp_new_row
	JOIN jsonb_each_text(audit_row.row_data) AS tmp_old_row ON (
		tmp_new_row.key = tmp_old_row.key
		AND tmp_new_row.value IS DISTINCT
		FROM tmp_old_row.value
	);
IF audit_row.changed_fields = '{}'::JSONB THEN
-- All changed fields are ignored. Skip this update.
RETURN NULL;
END IF;
ELSIF (
	TG_OP = 'DELETE'
	AND TG_LEVEL = 'ROW'
) THEN audit_row.row_data = row_to_json(OLD)::JSONB - excluded_cols;
ELSIF (
	TG_OP = 'INSERT'
	AND TG_LEVEL = 'ROW'
) THEN audit_row.row_data = row_to_json(NEW)::JSONB - excluded_cols;
ELSIF (
	TG_LEVEL = 'STATEMENT'
	AND TG_OP IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
) THEN audit_row.statement_only = 't';
ELSE RAISE EXCEPTION
'[audit_if_modified_func] - Trigger func added as trigger for unhandled case: %, %',
TG_OP,
TG_LEVEL;
RETURN NULL;
END IF;
INSERT INTO audit_logs
VALUES (audit_row.*);
RETURN NULL;
END;
$body$ LANGUAGE plpgsql;
COMMENT ON FUNCTION audit_if_modified_func() IS $body$ Track changes to a table
 at the statement and / or row level.Optional parameters to trigger in CREATE
 TRIGGER call: param 0: boolean, whether to log the query text.Default
 't'.param 1: text [], columns to ignore in updates.Default [].Updates to
 ignored cols are omitted from changed_fields.Updates with only ignored cols
 changed are not inserted into the audit log.Almost all the processing work is
 still done for updates that ignored.If you need to save the load, you need to
 use WHEN clause on the trigger instead. No warning	or error is issued if
 ignored_cols contains columns that do not exist in the target table.This lets
 you specify a standard set of ignored columns. There is no parameter to
 disable logging of values. Add this trigger as a 'FOR EACH STATEMENT' rather
 than 'FOR EACH ROW' trigger if you do not want to log row values.Note that the
 user name logged is the login role for the session.The audit trigger cannot
 obtain the active role because it is reset by the SECURITY DEFINER invocation
 of the audit trigger its self.$body$;

CREATE OR REPLACE FUNCTION audit_table(
	target_table regclass,
	audit_rows boolean,
	audit_query_text boolean,
	audit_inserts boolean,
	ignored_cols text []
) RETURNS void AS $body$
DECLARE stm_targets text = 'INSERT OR UPDATE OR DELETE OR TRUNCATE';
_q_txt text;
_ignored_cols_snip text = '';
BEGIN PERFORM deaudit_table(target_table);
-- Log the begin audit event into the audit table.
INSERT INTO audit_logs (
	event_id,
	schema_name,
	table_name,
	relid,
	session_user_name,
	action_tstamp_tx,
	action_tstamp_stm,
	action_tstamp_clk,
	transaction_id,
	application_name,
	client_addr,
	client_port,
	pid,
	client_query,
	action,
	row_data,
	statement_only)
SELECT
	nextval('audit_logs_event_id_seq'),
	-- event_id
	relnamespace::regnamespace::text,
	-- schema_name from pg_catalog.pg_class
	relname::text,
	-- table_name from pg_catalog.pg_class
	target_table::regclass,
	-- relation OID
	session_user::text,
	-- session_user_name
	current_timestamp,
	-- action_tstamp_tx
	statement_timestamp(),
	-- action_tstamp_stm
	clock_timestamp(),
	-- action_tstamp_clk
	txid_current(),
	-- transaction ID
	current_setting('application_name'),
	-- client application
	inet_client_addr(),
	-- client_addr
	inet_client_port(),
	-- client_port
	pg_backend_pid(),
	-- session/connection/process ID
	current_query(),
	-- top-level query or queries (if multistatement) from client
	'A',
	-- action
	jsonb_build_object(
		'audit_rows', audit_rows,
	  'audit_query_text', audit_query_text,
		'audit_inserts', audit_inserts,
		'ignored_cols', ignored_cols
	),
	-- save the arguments declaring what is audited and not audited into row_data
	'f'
	-- statement_only
FROM pg_catalog.pg_class
WHERE oid = target_table::regclass;
IF audit_rows THEN
    IF array_length(ignored_cols, 1) > 0
    THEN _ignored_cols_snip = ', ' || quote_literal(ignored_cols);
END IF;
_q_txt = 'CREATE TRIGGER audit_trigger_row AFTER ' || CASE
	WHEN audit_inserts THEN 'INSERT OR '
	ELSE ''
END || 'UPDATE OR DELETE ON ' || target_table
|| ' FOR EACH ROW EXECUTE PROCEDURE audit_if_modified_func('
|| quote_literal(audit_query_text) || _ignored_cols_snip || ');';
RAISE NOTICE '%',
_q_txt;
EXECUTE _q_txt;
stm_targets = 'TRUNCATE';
ELSE
END IF;
_q_txt = 'CREATE TRIGGER audit_trigger_stm AFTER ' || stm_targets
|| ' ON ' || target_table
|| ' FOR EACH STATEMENT EXECUTE PROCEDURE audit_if_modified_func('
|| quote_literal(audit_query_text) || ');';
RAISE NOTICE '%',
_q_txt;
EXECUTE _q_txt;
END;
$body$ LANGUAGE plpgsql;
COMMENT ON FUNCTION audit_table(
	regclass, boolean, boolean, boolean, text []
) IS $body$
Add auditing support to a table.Arguments: target_table: Table name, schema
 qualified if not on search_path audit_rows: Record each row change, or only
 audit at a statement level audit_query_text: Record the text of the client
 query that triggered the audit event ? audit_inserts: Audit insert statements
 or only updates / deletes / truncates ? ignored_cols: Columns to exclude from
 update diffs, ignore updates that change only ignored cols.$body$;

-- Provide a convenience call wrapper for the simplest case
-- of row-level logging with no excluded cols and query logging enabled.
CREATE OR REPLACE FUNCTION audit_table(
	target_table regclass
) RETURNS void AS $body$
SELECT audit_table($1, BOOLEAN 't', BOOLEAN 't', BOOLEAN 't', ARRAY []::text []);
$body$ LANGUAGE sql;
COMMENT ON FUNCTION audit_table(regclass) IS $body$
Add auditing support to the given table.Row - level changes will be logged with
 full client query text.No cols are ignored.$body$;
CREATE OR REPLACE FUNCTION deaudit_table(
	target_table regclass
) RETURNS void AS $body$ BEGIN
-- Log the deaudit call event into the audit table.
INSERT INTO audit_logs (
	event_id,
	schema_name,
	table_name,
	relid,
	session_user_name,
	action_tstamp_tx,
	action_tstamp_stm,
	action_tstamp_clk,
	transaction_id,
	application_name,
	client_addr,
	client_port,
	pid,
	client_query,
	action,
	statement_only)
SELECT
	nextval('audit_logs_event_id_seq'),
	-- event_id
	relnamespace::regnamespace::text,
	-- schema_name from pg_catalog.pg_class
	relname::text,
	-- table_name from pg_catalog.pg_class
	target_table::regclass,
	-- relation OID
	session_user::text,
	-- session_user_name
	current_timestamp,
	-- action_tstamp_tx
	statement_timestamp(),
	-- action_tstamp_stm
	clock_timestamp(),
	-- action_tstamp_clk
	txid_current(),
	-- transaction ID
	current_setting('application_name'),
	-- client application
	inet_client_addr(),
	-- client_addr
	inet_client_port(),
	-- client_port
	pg_backend_pid(),
	-- session/connection/process ID
	current_query(),
	-- top-level query or queries (if multistatement) from client
	'S',
	-- action
	'f' -- statement_only
FROM pg_catalog.pg_class
WHERE oid = target_table::regclass;
EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_row ON ' || target_table;
EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_stm ON ' || target_table;
END;
$body$ LANGUAGE plpgsql;
COMMENT ON FUNCTION deaudit_table(
	regclass
) IS $body$ Remove auditing support to the given table.$body$;
CREATE OR REPLACE VIEW audited_tables AS
SELECT DISTINCT
	triggers.trigger_schema AS schema,
	triggers.event_object_table AS auditedtable
FROM information_schema.triggers
WHERE
	triggers.trigger_name::text IN (
		'audit_trigger_row'::text,
		'audit_trigger_stm'::text
	)
ORDER BY
	schema,
	auditedtable;
COMMENT ON VIEW audited_tables IS $body$ View showing all tables with auditing
set up.Ordered by schema,
	then table.$body$;

-- Enable audit logs on PDC tables
SELECT audit_table('application_form_fields');
SELECT audit_table('application_forms');
SELECT audit_table('base_field_localizations');
SELECT audit_table('base_fields');
SELECT audit_table('base_fields_copy_tasks');
SELECT audit_table('bulk_upload_tasks');
SELECT audit_table('changemakers');
SELECT audit_table('changemakers_proposals');
SELECT audit_table('data_providers');
SELECT audit_table('ephemeral_user_group_associations');
SELECT audit_table('fiscal_sponsorships');
SELECT audit_table('funders');
SELECT audit_table('migrations');
SELECT audit_table('opportunities');
SELECT audit_table('platform_provider_responses');
SELECT audit_table('proposal_field_values');
SELECT audit_table('proposal_versions');
SELECT audit_table('proposals');
SELECT audit_table('sources');
SELECT audit_table('user_changemaker_permissions');
SELECT audit_table('user_funder_permissions');
SELECT audit_table('user_group_changemaker_permissions');
SELECT audit_table('user_group_data_provider_permissions');
SELECT audit_table('user_group_funder_permissions');
SELECT audit_table('users');
