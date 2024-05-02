# Changelog for @pdc/service

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.9.1 2024-05-03

### Changed

- Several fields that were marked as optional are now properly marked as required.

## 0.9.0 2024-05-02

### Added

- `BaseField` now has a `scope` attribute.

### Changed

- The GET `/opportunities` endpoint now returns an `OpportunityBundle` and accepts pagination parameters.
- Added a new `Organization` attribute `taxId` which contains the same value as `employerIdentificationNumber`.
- Deprecated the `Organizations` attribute `employerIdentificationNumber`. Please update your clients to use `taxId` instead.

## 0.8.0 2024-04-23

### Added

- The `BulkUpload` entity now has a `createdBy` attribute.
- The `Proposal` entity now has a `createdBy` attribute.
- The `/proposals` endpoint now supports a `createdBy` filter.
- The `User` type now exists.
- The GET `/users` endpoint now exists.

### Changed

- The `/bulkUploads` endpoint will now only return bulk uploads associated with the current user.
- The `/proposals` endpoint will now only return proposals associated with the current user.

## 0.7.0 2024-04-04

### Changed

- The `data_type` field of the `BaseField` entity is now an enum of acceptable types.
- The `ProposalFieldValue` entity now has a `is_valid` field.

## 0.6.0 2024-03-29

### Changed

- The `/applicationForms` endpoint now returns an `ApplicationFormBundle`.
- The `/applicationForms` endpoint now returns deep `ApplicationForm` objects.
- The `/applicationForms/:id` endpoint now returns a deep `ApplicationForm object.

### Removed

- The `/applicationForms/:id` endpoint no longer has a `includeFields` query parameter, as it always includes deep fields.

## 0.5.0 - 2024-03-27

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
