ALTER TABLE users
  ADD COLUMN source_id INTEGER,
  ADD CONSTRAINT fk_source_id
    FOREIGN KEY(source_id)
      REFERENCES sources(id);
