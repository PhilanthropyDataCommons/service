# Changelog for @pdc/service

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- The `OrganizationProposal` entity now exists.
- The `OrganizationProposalBundle` entity now exists.
- It is now possible to filter `/proposals` in terms of organization.
- It is now possible to filter `/organizations` in terms of proposal.

## 0.4.0 - 2024-02-29

### Removed

- The `Applicant` entity no longer exists.
- All `/applicants/*` endpoints are removed.
- The `applicantId` attribute of `Proposal` has been removed.

## 0.3.1 - 2024-02-29

### Added

- The `Organization` entity now exists.
- The GET `/organizations` endpoint now exists.
- The GET `/organizations:id` endpoint now exists.
- The POST `/organizations` endpoint now exists.

## 0.3.0 - 2023-05-03

### Changed

- The `GET` and `POST` `/canonicalFields` endpoints have been renamed to `/baseFields`.
- The `CanonicalField` schema type has been renamed to `BaseField`.
- The `ApplicationFormField.canonicalFieldId` attribute of the has been renamed to `ApplicationFormField.baseFieldId`.

## 0.2.0 - 2023-04-20

### Changed

- The `GET /proposals` endpoint now returns a new `Bundle` wrapper around response data.
