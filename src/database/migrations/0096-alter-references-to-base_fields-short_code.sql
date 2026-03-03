-- This lays the groundwork to allow simple renaming of base_field short_code.
-- It is anticipated that a separate table would be created to support
-- redirects at the API level because a simple rename without a redirect
-- breaks previously working URLs.
ALTER TABLE application_form_fields DROP CONSTRAINT base_field_short_code_fkey;
ALTER TABLE application_form_fields
ADD CONSTRAINT base_field_short_code_fkey FOREIGN KEY (base_field_short_code)
REFERENCES base_fields (short_code) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE base_field_localizations
DROP CONSTRAINT base_field_short_code_fkey;
ALTER TABLE base_field_localizations
ADD CONSTRAINT base_field_short_code_fkey FOREIGN KEY (base_field_short_code)
REFERENCES base_fields (short_code) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE changemaker_field_values
DROP CONSTRAINT fk_base_field;
ALTER TABLE changemaker_field_values
ADD CONSTRAINT fk_base_field FOREIGN KEY (base_field_short_code)
REFERENCES base_fields (short_code) ON DELETE RESTRICT ON UPDATE CASCADE;
