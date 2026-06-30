Any `.sql` files in this folder will be invoked on application startup.

These files are NOT migration files, but rather are files to initialize the database once per session.

Specifically, they can be edited over time.

## Load order

Files are created one at a time in filename order, so a numeric prefix controls when a file is created relative to the others — lower numbers first. Use a prefix where it is necessary: when a function written in `LANGUAGE sql` references another function defined here, give it a higher prefix than the functions it depends on so they already exist when it is created. Function body validation stays enabled, so a function created before something it references — a wrong prefix, or a circular reference — fails loudly at startup rather than on its first call.

Functions written in `LANGUAGE plpgsql` resolve their references when called rather than when created, so their order never matters.

## Serialization: shapes vs. result builders

Entity serialization is split into two kinds of function so the JSON structure is defined once and the heavy lifting stays out of the read hot path.

### Shape functions — `<entity>_to_json`

Assemble an entity's JSON from its row plus its already-gathered children, passed in as `jsonb` arguments. They do **no table access** — a shape is the single source of truth for an entity's structure and nothing else:

```sql
proposal_to_json(proposal, opportunity, versions, changemakers)
proposal_version_to_json(proposal_version, field_values, source)
proposal_field_value_to_json(proposal_field_value, application_form_field, file)
```

Because they never query, shapes can be reused by any caller — one row at a time or thousands — without dictating how the children are loaded.

### Result builders — `build_<entity>_result(s)`

Load an entity's children and assemble the result with the shape functions. The gathering — and the decision of what to include — lives here, never in a shape.

- `build_proposals_results(proposals[], …)` serializes a whole page in one pass for the proposals read path. It gathers inline rather than calling the single-entity builders: crossing a function boundary per level would push the rows through array round-trips the planner cannot see past, multiplying buffer reads. Reusing the (table-free) shapes keeps it DRY regardless.
- `build_proposal_version_result(…)` and `build_proposal_field_value_result(…)` serialize a single entity for the per-row endpoints, where composing builders is fine because the work is bounded to one entity.

`assert_proposal_field_value_not_forbidden` raises if a field value belongs to a forbidden base field. Read paths exclude forbidden fields via the `permitted_*` functions; the guard covers paths that serialize a row directly (the field value insert), which do not filter by permission.

## Permission lookups

`permitted_*_ids` return the entities a user may access. The `_among` variants take a candidate id array and return the permitted subset, keeping the work proportional to the candidates rather than the whole corpus — use them when a caller already holds a bounded set (a page, one version's field values).
