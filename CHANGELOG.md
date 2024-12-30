# Changelog for @pdc/service

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- Manage user-funder permissions using `PUT`, and `DELETE` on `/user/{keycloakUserId}/funders/{funderShortCode}/permissions/{permission}`.

## 0.16.6 2024-12-23

### Changed

- `Changemaker` now has `keycloakOrganizationId`, the UUID in Keycloak for the related Organization.

## 0.16.5 2024-12-23

### Changed

- `Funder` now has `keycloakOrganizationId`, the UUID in Keycloak for the related Organization.

## 0.16.4 2024-12-23

### Changed

- Upgraded to use OpenAPI Specification 3.1.
- `DataProvider` type now has `keycloakOrganizationId`, the UUID in Keycloak for the related Organization.

### Added

- Manage user changemaker permissions using `GET`, `PUT`, and `DELETE` on `/user/{keycloakUserId}/changemakers/{changemakerId}/permissions/{permission}`.

## 0.16.3 2024-12-02

### Fixed

- `Changemaker` type was missing the fields property.

## 0.16.2 2024-11-12

### Fixed

- `User` type had an inaccurate specification regarding permission attributes.

## 0.16.1 2024-11-07

### Changed

- `BulkUpload` is now `BulkUploadTask`.
- `GET /bulkUpload` and `POST /bulkUpload` are now `GET /tasks/bulkUpload` and `POST /tasks/bulkUpload`.
  Future jobs for the graphile-worker will be routed under `tasks` as well.

## 0.16.0 2024-11-7

### Added

- `User` now has a `permissions` attribute which includes information about various granted permissions.

## 0.15.1 2024-10-28

### Fixed

- `SourceBundle` is now present in the swagger spec.
- `GET /sources` is now correctly documented as returning a `SourceBundle`.

## 0.15.0 2024-10-14

### Changed

- `Organization` is now `Changemaker`.
- `OrganizationProposal` is now `ChangemakerProposal`.

## 0.14.0 2024-10-11

### Changed

- `Users.id` no longer exists; `keycloakUserId` is now the primary identifier of any given `User`.
- `Proposal.createdBy` is now a UUID reference to the creator's `keycloakUserId`.
- `ProposalVersion.createdBy` is now a UUID reference to the creator's `keycloakUserId`.
- `BulkUpload.createdBy` is now a UUID reference to the creator's `keycloakUserId`.

## 0.13.0 2024-09-26

### Changed

- `authenticationId` is now `keycloakUserId` (a UUID) in the `User` entity, as well as for any endpoints that allowed filtering by `authenticationId`.

## 0.12.4 2024-09-19

### Added

- `createdBy` is now an attribute of `ProposalVersion`.

## 0.12.3 2024-09-19

### Added

- New `Funder` entity type with corresponding `PUT` and `GET` endpoints.
- New `DataProvider` entity type with corresponding `PUT` and `GET` endpoints.
- New `Source` entity type with corresponding `PUT` and `GET` endpoints.
- `sourceId` is now an attribute of `BulkUpload`.
- `sourceId` is now an attribute of `ProposalVersion`.

## 0.11.0 2024-05-20

### Added

- The `BulkUploadBundle` entity now exists, and the `/bulkUploads` endpoint is properly documented to return that type.

### Fixed

- Several read-only fields were improperly defined, resulting in improper SDK results.
- `WritablePresignedPostRequest` will no longer require a populated `presignedPost`.

### Changed

- Created a new `PresignedPost` entity type instead of directly embedding the definition in `PresignedPostRequest`.

## 0.10.0 2024-05-03

### Removed

- The `Organizations` attribute `employerIdentificationNumber` has been removed.

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
