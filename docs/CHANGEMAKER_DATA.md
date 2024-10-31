# Changemaker data in the Philanthropy Data Commons (PDC)

Data about changemakers (such as grant seekers, applicants, non-profits, etc.),
are stored and retrieved via the central PDC instance API.

## Storing changemaker data

To add a changemaker to the PDC, use `POST /changemakers`. Note, however, that
this endpoint only registers a changemaker by tax ID and name. It is not the
endpoint to add other changemaker attributes such as location or contacts. One
writes changemaker data to PDC via `POST /proposalVersions` and its associated
endpoints. Changemaker data cannot currently be directly written to the PDC,
though that functionality is on the roadmap. Instead, changemaker data is
aggregated from any proposals that have been submitted by the changemaker.

## Viewing changemaker data

To see changemaker data in the PDC, use `GET /changemakers`. This endpoint
retrieves rich data about changemakers. The rich data retrieved from `GET
/changemakers` are aggregated and prioritized by the back-end service to present
a best-effort, aka "gold", version of attributes of a changemaker from PDC data.
For each base field in the PDC that has more than one associated response value
for the given changemaker, PDC returns exactly one prioritized value. Each
returned value may come from a separate data source, such as a proposal to a
funder, a data platform provider (DataProvider in PDC), or the changemakers
themselves. As of this writing values come solely from proposals.

### Data prioritization or conflict resolution ("gold" data)

Changemaker data can vary across or within data sources. The PDC automatically
selects the best available data on a field-by-field basis using a heuristic. As
of this writing, the PDC uses the following heuristic:

- only valid data (i.e. well-formatted data) are returned,
- changemaker-sourced data are better than Funder-sourced data,
- Funder-sourced data are better than DataProvider-sourced data,
- DataProvider-sourced data are better than old PDC (source unknown) data,
- and newer data are better than older data.

The "valid data" rule is a hard filter. No invalid data are returned. The next
three rules are to choose from among categories of sources. The last rule breaks
a tie when there are values from multiple sources within a category.

For example, if the same funder posted multiple proposals from a given
changemaker to the PDC, and these were the only source of data for that
changemaker, the most recent data values for each base field would be returned.
However, if a changemaker (theoretically as of this writing) added a value to
the PDC, that changemaker-added value would take priority for that one base
field. In either case, the response may have data from multiple sources because
the prioritization applies to each base field having associated data values.

For exact prioritization details, see the source code at
`src/database/initialization/changemaker_to_json.sql`.

Only authenticated users may see rich field values. Unauthenticated users will
always see an empty list of field values in the response.

In the future, with finer-grained permissioning, any given user should only see
the values that user has been authorized to see.
