# Changelog for @pdc/service

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.31.0 2026-02-12

### Added

- `GET /files` endpoint to retrieve a paginated list of files. Users see only files they created; administrators can see all files and filter by creator using the `createdBy` parameter.
- Added optional `name` field to `ApplicationForm` entity for human-readable display.

### Changed

- Viewing changemaker field values now requires explicit `view | changemakerFieldValue` scope, unless the field has `public` sensitivity classification. This scope can be granted at the changemaker context level.
- Viewing proposal field values now requires explicit `view | proposalFieldValue` scope. This scope can be granted at the proposalFieldValue, proposal, opportunity, funder, or changemaker context level. Users with only `view | proposal` scope will see proposals with empty `fieldValues` arrays.
- Existing permissions with `proposal` scope have been migrated to also include `proposalFieldValue` scope, ensuring backward compatibility.
- Migrated changemaker permissions to the unified `permission_grants` table. Changemaker permissions should now be managed via the `/permissionGrants` endpoints.
- Migrated funder permissions to the unified `permission_grants` table. Funder permissions should now be managed via the `/permissionGrants` endpoints.
- Migrated data provider permissions to the unified `permission_grants` table. Data provider permissions should now be managed via the `/permissionGrants` endpoints.
- Migrated opportunity permissions to the unified `permission_grants` table. Opportunity permissions should now be managed via the `/permissionGrants` endpoints.
- The `permissions` property has been removed from the `User` type entirely. All permission checks are now performed asynchronously via the permission_grants table.
- Viewing proposals, proposal versions, and changemaker-proposal associations now requires `view | proposal` scope instead of inheriting from `view | funder` or `view | changemaker`. The `view | proposal` scope can be granted at the proposal, opportunity, funder, or changemaker context level and will be inherited appropriately.

### Removed

- Legacy changemaker permission endpoints have been removed:
  - `PUT /users/{userKeycloakUserId}/changemakers/{changemakerId}/permissions/{permission}`
  - `DELETE /users/{userKeycloakUserId}/changemakers/{changemakerId}/permissions/{permission}`
  - `PUT /userGroups/{keycloakOrganizationId}/changemakers/{changemakerId}/permissions/{permission}`
  - `DELETE /userGroups/{keycloakOrganizationId}/changemakers/{changemakerId}/permissions/{permission}`
- `UserChangemakerPermission` and `UserGroupChangemakerPermission` schemas have been removed from the OpenAPI spec.
- Legacy funder permission endpoints have been removed:
  - `PUT /users/{userKeycloakUserId}/funders/{funderShortCode}/permissions/{permission}`
  - `DELETE /users/{userKeycloakUserId}/funders/{funderShortCode}/permissions/{permission}`
  - `PUT /userGroups/{keycloakOrganizationId}/funders/{funderShortCode}/permissions/{permission}`
  - `DELETE /userGroups/{keycloakOrganizationId}/funders/{funderShortCode}/permissions/{permission}`
- `UserFunderPermission` and `UserGroupFunderPermission` schemas have been removed from the OpenAPI spec.
- Legacy data provider permission endpoints have been removed:
  - `PUT /users/{userKeycloakUserId}/dataProviders/{dataProviderShortCode}/permissions/{permission}`
  - `DELETE /users/{userKeycloakUserId}/dataProviders/{dataProviderShortCode}/permissions/{permission}`
  - `PUT /userGroups/{keycloakOrganizationId}/dataProviders/{dataProviderShortCode}/permissions/{permission}`
  - `DELETE /userGroups/{keycloakOrganizationId}/dataProviders/{dataProviderShortCode}/permissions/{permission}`
- `UserDataProviderPermission` and `UserGroupDataProviderPermission` schemas have been removed from the OpenAPI spec.
- Legacy opportunity permission endpoints have been removed:
  - `PUT /users/{userKeycloakUserId}/opportunities/{opportunityId}/permissions/{opportunityPermission}`
  - `DELETE /users/{userKeycloakUserId}/opportunities/{opportunityId}/permissions/{opportunityPermission}`
  - `PUT /userGroups/{keycloakOrganizationId}/opportunities/{opportunityId}/permissions/{opportunityPermission}`
  - `DELETE /userGroups/{keycloakOrganizationId}/opportunities/{opportunityId}/permissions/{opportunityPermission}`
- `UserOpportunityPermission` and `UserGroupOpportunityPermission` schemas have been removed from the OpenAPI spec.

### Fixed

- `Changemaker.fields` file values are now decorated with `downloadUrl` to allow access to file contents.
- `ChangemakerProposal.proposal.versions[].fieldValues` file values are now decorated with `downloadUrl`.

## 0.30.0 2026-01-27

### Added

- `PermissionGrant` entity type now exists to represent permission grants that give a user or user group specific permissions on a context entity and its related entities.
- `GET /permissionGrants` endpoint now exists to retrieve a paginated list of permission grants. Requires administrator role.
- `POST /permissionGrants` endpoint now exists to create a new permission grant. Requires administrator role.
- `GET /permissionGrants/{permissionGrantId}` endpoint now exists to retrieve a specific permission grant by ID. Requires administrator role.
- `DELETE /permissionGrants/{permissionGrantId}` endpoint now exists to delete a specific permission grant by ID. Requires administrator role.
- `PermissionGrantEntityType` schema now exists to enumerate entity types that can be referenced in permission grants.
- `PermissionGrantVerb` schema now exists to enumerate permission verbs (`view`, `create`, `edit`, `delete`, `manage`).

## 0.29.0 2025-01-23

### Added

- `GET /applicationForm/{applicationFormId}/proposalDataCsv` returns an application form in a usable csv format for making bulk uploads
- `applicationFormId` is now a field on `bulkUploadTasks`

### Changed

- `ApplicationForms` are no longer created during a bulk upload, and bulk uploads must now explicitly reference an existing application form on creation.

## 0.28.0 2025-01-08

### Added

- `ChangemakerFieldValueBatch` entities now have a `createdBy` attribute tracking the user who created the batch.
- `GET /changemakerFieldValueBatches` endpoint now exists to retrieve a paginated list of changemaker field value batches.
- `GET /changemakerFieldValueBatches/:batchId` endpoint now exists to retrieve a specific changemaker field value batch by ID.
- `GET /changemakerFieldValues` endpoint now exists to retrieve a paginated list of changemaker field values with optional filtering by `changemakerFieldValueBatch` and `changemaker`.
- `GET /changemakerFieldValues/:fieldValueId` endpoint now exists to retrieve a specific changemaker field value by ID.
- `FieldValueBase` type now exists as a common base for `ProposalFieldValue` and `ChangemakerFieldValue`.
- `Changemaker.fields` now includes `ChangemakerFieldValue` objects in addition to `ProposalFieldValue` objects, with source-based priority determining the "gold" value per base field.

### Changed

- `ProposalFieldValue` and `ChangemakerFieldValue` OpenAPI schemas now use `allOf` to extend `FieldValueBase`.
- `Changemaker.fields` OpenAPI schema now uses `oneOf` to accept either `ProposalFieldValue` or `ChangemakerFieldValue` items.

## 0.27.0 2025-12-22

### Added

- `ChangemakerFieldValueBatch` entity type now exists to group changemaker field values that were imported together from an external source.
- `POST /changemakerFieldValueBatches` endpoint now exists to create changemaker field value batches.
- `ChangemakerFieldValue` entity type now exists to represent field values directly associated with changemakers.
- `POST /changemakerFieldValues` endpoint now exists to create changemaker field values.

## 0.26.0 2025-10-30

### Added

- `GET /baseFields` now has an optional `sensitivityClassifications` parameter.
- `GET /baseFields` by default returns non-forbidden base fields.

## 0.25.5 2025-10-22

### Added

- `BulkUpload` entities now have a `createdByUser` attribute.

## 0.25.4 2025-10-22

### Fixed

- `POST /changemakers` OpenAPI documentation was improved.

## 0.25.3 2025-10-22

### Added

- `File` entities are now decorated with a `downloadUrl` when appropriate.

### Fixed

- `File` is now properly documented as potentially having a `presignedPost` attribute.

## 0.25.2 2025-10-21

### Added

- `ProposalFieldValue` now includes a `file` attribute if the field value references a valid `File`.

## 0.25.1 2025-10-10

### Added

- `BulkUploadTask` now accepts a nullable `attachmentsArchiveFileId`.

## 0.25.0 2025-10-03

### Added

- `GET /tasks/bulkUploads` now includes `BulkUploadLog` entries under `logs`.

## 0.24.1 2025-09-11

### Added

- `BaseField` can now be of type `file`.
- `S3Bucket` now exists.

### Fixed

- `BaseField` is now properly documented as being allowed to be type `currency`.

### Changed

- `File` now has an `s3BucketName` attribute as well as an `s3Bucket` attribute, and no longer has a has a `bucketName` or `bucketRegion` attribute.
- `BulkUploadTask` no longer stores file metadata, but instead requires a `proposalsDataFileId` attribute which references a `File.id`.

## 0.23.0 2025-08-29

### Changed

- `/presignedPostRequests` has been renamed to `/files` and the returned `File` entity has additional attributes.

## 0.22.1 2025-08-15

### Added

- `Proposal` entities now include deep `Opportunity` data.

### Fixed

- The required fields associated with `UserGroupChangemakerPermission`, `UserGroupDataProviderPermission`, and `UserGroupFunderPermission` are now correctly documented.
- The various opportunity permission endpoints are now correctly documented.

## 0.22.0 2025-07-22

- Funders now have a `isCollaborative` attribute.
- Added `FunderCollaborativeMember` entity type to represent collaborators on Funders, which extend funder permissions to other funder collaborators.
- Added `FunderCollaborativeInvitation` entity type to represent invitations to collaborate on a funder.

## 0.21.0 2025-07-16

### Added

- A new `PUT /users/{userId}/opportunities/{opportunityId}/permissions/{opportunityPermission}` endpoint now exists
- A new `DELETE /users/{userId}/opportunities/{opportunityId}/permissions/{opportunityPermission}` endpoint now exists
- A new `PUT /userGroups/{keycloakOrganizationId}/opportunities/{opportunityId}/permissions/{opportunityPermission}` endpoint now exists
- A new `DELETE /userGroups/{keycloakOrganizationId}/opportunities/{opportunityId}/permissions/{opportunityPermission}` endpoint now exists

## 0.20.2 2025-07-10

### Added

- `ApplicationFormField` now have an `instructions` attribute.

## 0.20.1 2025-07-10

### Added

- `GET /proposals` now accepts a `funder` querystring filter which returns a subset of proposals based on the funder of the proposal's opportunity.

## 0.20.0 2025-06-17

### Changed

- The `BaseField.scope` attribute is now `BaseField.category` and includes several additional values.

## 0.19.0 2025-06-17

### Added

- `ProposalFieldValues` now have a `goodAsOf` attribute.
- `BaseFields` now have a `sensitivityClassification` attribute.

## 0.18.0 2025-04-28

### Changed

- `BaseFields` are now primary keyed on the `shortCode` value, and have had corresponding
  foreign keys in the `ApplicationFormField` and `BaseFieldLocalization` tables updated to match.

## 0.17.1 2025-04-21

### Added

- `BaseFields` now have a `valueRelevanceHours` attribute which signal how long values associated with the base field are considered relevant.

## 0.17.0 2025-02-13

### Changed

- `Opportunity` and `BulkUploadTask` now require a `funderShortCode` on creation.

## 0.16.8 2025-02-13

### Added

- Add and remove fiscal sponsors using `PUT` and `DELETE` on `/changemakers/{changemakerId}/fiscalSponsors/{fiscalSponsorChangemakerId}`.
- There is now a type `ShallowChangemaker` available.
- `Changemaker` now has a `fiscalSponsors` attribute, a list of `ShallowChangemaker`.

## 0.16.7 2025-02-05

### Added

- Manage user-funder permissions using `PUT`, and `DELETE` on `/user/{keycloakUserId}/funders/{funderShortCode}/permissions/{permission}`.
- Manage user-data-provider permissions using `PUT`, and `DELETE` on `/user/{keycloakUserId}/funders/{funderShortCode}/permissions/{permission}`.
- Manage user-group-changemaker permissions using `PUT`, and `DELETE` on `/userGroups/{keycloakOrganizationId}/changemaker/{changemakerId}/permissions/{permission}`.
- Manage user-group-data-provider permissions using `PUT`, and `DELETE` on `/userGroups/{keycloakOrganizationId}/dataProvider/{dataProviderShortCode}/permissions/{permission}`
- Manage user-group-funder permissions using `PUT`, and `DELETE` on `/userGroups/{keycloakOrganizationId}/funders/{funderShortCode}/permissions/{permission}`
- Manage user-funder permissions using `PUT`, and `DELETE` on `/user/{keycloakUserId}/funders/{funderShortCode}/permissions/{permission}`.
- Update changemaker attributes using `PATCH` on `/changemakers/{changemakerId}`. This was available in the API starting 2025-01-30 under the previous version number.

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
