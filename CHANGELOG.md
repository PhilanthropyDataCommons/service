# Changelog for @pdc/service

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.3.0 - 2023-05-03
### Changed
- The `GET` and `POST` `/canonicalFields` endpoints have been renamed to `/baseFields`.
- The `CanonicalField` schema type has been renamed to `BaseField`.
- The `ApplicationFormField.canonicalFieldId` attribute of the has been renamed to `ApplicationFormField.baseFieldId`.

## 0.2.0 - 2023-04-20
### Changed
- The `GET /proposals` endpoint now returns a new `Bundle` wrapper around response data.

