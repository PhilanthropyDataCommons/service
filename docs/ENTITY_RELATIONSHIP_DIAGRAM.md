# PDC Schema

## Entity Relationship Diagram

```mermaid
erDiagram
  BaseField {
    string shortCode PK
    string label
    string description
    string dataType
    string category
    int valueRelevanceHours
    string sensitivityClassification
    datetime createdAt
  }
  BaseFieldLocalization {
    int id PK
    string baseFieldShortCode FK
    string language
    string label
    string description
    datetime createdAt
  }
  Changemaker {
    int id PK
    string taxId
    string name
    uuid keycloakOrganizationId
    datetime createdAt
  }
  ChangemakerFieldValue {
    int id PK
    int changemakerId FK
    string baseFieldShortCode FK
    int batchId FK
    string value
    boolean isValid
    datetime goodAsOf
    datetime createdAt
  }
  ChangemakerFieldValueBatch {
    int id PK
    int sourceId FK
    string notes
    datetime createdAt
  }
  ChangemakersProposal {
    int id PK
    int changemakerId FK
    int proposalId FK
    datetime createdAt
  }
  FiscalSponsorship {
    int fiscalSponseeChangemakerId PK_FK
    int fiscalSponsorChangemakerId PK_FK
    uuid createdBy FK
    datetime notAfter
    datetime createdAt
  }
  Proposal {
    int id PK
    int opportunityId FK
    string externalId
    uuid createdBy FK
    datetime createdAt
  }
  Opportunity {
    int id PK
    string title
    string funderShortCode FK
    datetime createdAt
  }
  ApplicationForm {
    int id PK
    int opportunityId FK
    int version
    datetime createdAt
  }
  ApplicationFormField {
    int id PK
    int applicationFormId FK
    string baseFieldShortCode FK
    int position
    string label
    string instructions
    datetime createdAt
  }
  ProposalVersion {
    int id PK
    int proposalId FK
    int sourceId FK
    int applicationFormId FK
    int version
    uuid createdBy FK
    datetime createdAt
  }
  ProposalFieldValue {
    int id PK
    int proposalVersionId FK
    int applicationFormFieldId FK
    int position
    string value
    boolean isValid
    datetime goodAsOf
    datetime createdAt
  }
  DataProvider {
    string shortCode PK
    string name
    uuid keycloakOrganizationId
    datetime createdAt
  }
  Funder {
    string shortCode PK
    string name
    uuid keycloakOrganizationId
    boolean isCollaborative
    datetime createdAt
  }
  Source {
    int id PK
    string label
    string funderShortCode FK
    int changemakerId FK
    string dataProviderShortCode FK
    datetime createdAt
  }
  File {
    int id PK
    string region
    int s3BucketId FK
    string fileKey
    string mediaType
    uuid createdBy FK
    datetime createdAt
  }
  BulkUploadTask {
    int id PK
    string status
    int sourceId FK
    int proposalsDataFileId FK
    int attachmentsArchiveFileId FK
    string funderShortCode FK
    uuid createdBy FK
    datetime createdAt
  }
  BulkUploadLog {
    int id PK
    int bulkUploadTaskId FK
    string message
    datetime createdAt
  }
  User {
    uuid keycloakUserId PK
    string keycloakUserName
    datetime createdAt
  }
  PermissionGrant {
    int id PK
    string granteeType
    uuid granteeUserKeycloakUserId
    uuid granteeKeycloakOrganizationId
    string contextEntityType
    int changemakerId FK
    string funderShortCode FK
    string dataProviderShortCode FK
    int opportunityId FK
    int proposalId FK
    int proposalVersionId FK
    int applicationFormId FK
    int applicationFormFieldId FK
    int proposalFieldValueId FK
    int sourceId FK
    int bulkUploadTaskId FK
    int changemakerFieldValueId FK
    string[] scope
    string[] verbs
    jsonb conditions
    uuid createdBy FK
    datetime createdAt
  }

  Proposal }|--|| Opportunity : "responds to"
  Opportunity ||--|{ ApplicationForm : establishes
  Funder ||--|{ Opportunity : has
  Funder ||--|{ BulkUploadTask : has
  ApplicationForm ||--|{ ApplicationFormField : has
  ApplicationFormField }o--|| BaseField : represents
  BaseField ||--o{ BaseFieldLocalization : "has localizations"
  Proposal ||--|{ ProposalVersion : has
  ProposalVersion ||--|{ ProposalFieldValue : contains
  ProposalVersion }o--|| ApplicationForm : "uses"
  ProposalFieldValue }o--|| ApplicationFormField : populates
  Changemaker ||--o{ ChangemakersProposal : "is associated with"
  Proposal ||--o{ ChangemakersProposal : "is associated with"
  Changemaker ||--o{ ChangemakerFieldValue : "has"
  ChangemakerFieldValue }o--|| BaseField : "is for"
  ChangemakerFieldValue }o--|| ChangemakerFieldValueBatch : "belongs to"
  ChangemakerFieldValueBatch }o--|| Source : "comes from"
  Source }|--o| Funder : "represents"
  Source }|--o| Changemaker : "represents"
  Source }|--o| DataProvider : "represents"
  ProposalVersion }o--|| Source : "comes from"
  Proposal }o--|| User : "is created by"
  ProposalVersion }o--|| User : "is created by"
  BulkUploadTask }o--|| User : "is created by"
  BulkUploadTask }o--|| Source : "uses"
  BulkUploadTask ||--o{ BulkUploadLog : "has"
  BulkUploadTask }o--|| File : "has proposals data"
  BulkUploadTask }o--o| File : "has attachments archive"
  PermissionGrant }o--o| Changemaker : "references"
  PermissionGrant }o--o| Funder : "references"
  PermissionGrant }o--o| DataProvider : "references"
  PermissionGrant }o--o| Opportunity : "references"
  PermissionGrant }o--o| Proposal : "references"
  PermissionGrant }o--o| ProposalVersion : "references"
  PermissionGrant }o--o| ApplicationForm : "references"
  PermissionGrant }o--o| ApplicationFormField : "references"
  PermissionGrant }o--o| ProposalFieldValue : "references"
  PermissionGrant }o--o| Source : "references"
  PermissionGrant }o--o| BulkUploadTask : "references"
  PermissionGrant }o--o| ChangemakerFieldValue : "references"
  PermissionGrant }o--|| User : "is created by"
  Changemaker ||--o{ FiscalSponsorship : "sponsors"
  Changemaker ||--o{ FiscalSponsorship : "is sponsored by"
```

## Narrative

1. A `Changemaker` is associated with a `Proposal` (via `ChangemakersProposal`).
2. A `Proposal` is a response to an `Opportunity`. An `Opportunity` represents a given challenge, RFP, etc.
3. An `Opportunity` establishes an `Application Form`. An application form is the set of fields that make up an application. An `Opportunity` might update its `Application Form` over time, which is why an `Opportunity` can have many `Application Forms`.
4. An `Application Form` will define many `Application Form Fields`.
5. An `Application Form Field` represents a `Base Field`.

Meanwhile...

6. A `Proposal` can have more than one `Proposal Version`. This occurs as a proposal is updated or revised.
7. A `Proposal Version` contains a set of `Proposal Field Values`. These are the responses that were provided for the proposal.
8. A `Proposal Field Value` contains a response to a given `Application Form Field`. Some fields might allow multiple responses, which is why we provide a `position`.

Additionally...

9. A `Changemaker` can have `Changemaker Field Values` that store field data directly associated with the changemaker (independent of any proposal).
10. `Changemaker Field Values` are grouped into `Changemaker Field Value Batches`, each of which comes from a `Source`.
11. `Changemakers` can have `Fiscal Sponsorship` relationships with other `Changemakers`.

The thinking is that when a new proposal is being written, a Grant Management System could ask the PDC "is there any pre-populated data we should use for this changemaker?"

PDC would then:

- Collect the most recent ProposalFieldValues for each BaseField for that Changemaker.
- Collect the most recent ChangemakerFieldValues for each BaseField for that Changemaker.

It would use the ProposalFieldValue set as the primary source, and the ChangemakerFieldValue set as a secondary source.

## Examples

### Registering an Application Form

```mermaid
sequenceDiagram
  actor Admin
  participant API
  participant Database
  Admin ->>+ API : Here is a new application form
  API ->>+ Database : Register any new base fields
  Database ->>- API : OK!
  API ->>+ Database : Register the new application form
  Database ->>- API : OK!
  API ->>- Admin :  OK!
```

New `Application Forms` will have to be externally defined; some day maybe we will make a user interface that generates an `Application Form` definition, but for the short term this will be manually written JSON (or YAML, or something else highly structured). The form will define the full set of `Application Form Fields` along with the shortCode of the `Base Field` to which the `Application Form Fields` map.

This might look something like this:

```
{
  "fields": [
    {
      "name": "Changemaker Name",
      "type": "string",
      "baseFieldShortCode": "changemaker_name",
    },
    {
      "name": "Have you ever seen the Mona Lisa?",
      "type": "boolean",
      "baseFieldShortCode": "mona_lisa_experience",
    }
  ]
}
```

The PDC API would then ingest that new form document. It would first register any `Base Fields` that did not already exist. It would then register the `Application Form` and `Application Form Fields`, with field-level associations to the `Base Fields`.

The database does not differentiate between "core" and "custom" fields. Rather, there will be a set of `Base Fields` that are used by varying numbers of `Application Forms`. We will likely see that some `Base Fields` are used more often than others, and some are only used by a single `Application Form`. We might choose a subset of the `Base Fields` to highlight in our documentation and might call those "core" fields; that decision is not directly relevant to the form.

### Pre-filling an Application

```mermaid
sequenceDiagram
  participant GMS
  participant API
  participant Database
  GMS ->>+ API : Get field values
  API ->>+ Database : Get Proposal Field Values
  Database ->>- API : Here they are
  API ->>+ Database : Get Changemaker Field Values
  Database ->>- API : Here they are
  API ->>- GMS :  Here they are
```

When a changemaker begins to fill out a proposal, the Grant Management System would request all field values known for that `Changemaker`. Which values are returned could be based on business logic; it could be the complete set; it could be restricted to just the fields associated with a given application form -- these would be implementation details but the form would support any of them.

The API would use the Database to collect values associated with past applications (`Proposal Field Values`); these have been directly entered by a changemaker representative.
The API would use the Database to also collect values associated with external / independent sources (`Changemaker Field Values`).

Which values are ultimately selected for prepopulation is an implementation detail. It could be that we decide that ALL distinct values should be returned, and the GMS should determine whether to render a "dropdown" the user could select from. It could be we decide that only the most recently updated values should be returned. It could be we decide that values associated with past proposals should override externally sourced values. Again, these would be implementation decisions but the form would support any of them.

### Submitting a Proposal

```mermaid
sequenceDiagram
  participant GMS
  participant API
  participant Database
  GMS ->>+ API : Save this completed Proposal
  API ->>+ Database : Create a new Proposal
  Database ->>- API : OK
  API ->>+ Database : Save the Proposal Field Values
  Database ->>- API : OK
  API ->>- GMS : OK
```

The above flow is based on an assumption that we know this is the first time the changemaker had submitted a proposal / it is not an update to an existing proposal.

The API would create a new Proposal, a new Proposal Version, and then it would store one `Proposal Field Value` per `Base Field`. Those field values would then be incorporated in future lookups according to the "Pre-filling a Proposal" logic.

The API might then send alerts to other GMSs depending on business logic, but that is an implementation detail and outside of the scope of this particular example.
