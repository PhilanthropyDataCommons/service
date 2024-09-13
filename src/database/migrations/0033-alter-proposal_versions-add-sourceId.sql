ALTER TABLE proposal_versions
  ADD COLUMN source_id INTEGER NOT NULL DEFAULT system_source_id(),
  ADD CONSTRAINT fk_source_id
    FOREIGN KEY(source_id)
      REFERENCES sources(id);

ALTER TABLE proposal_versions
  ALTER COLUMN source_id DROP DEFAULT;
