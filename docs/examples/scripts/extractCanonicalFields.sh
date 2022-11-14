#!/bin/bash

# Prints JSON objects with PDC-compatible canonicalFields from PSV files.
#
# The standard output not only has canonical fields but also data to help
# create a PDC application form.
#
# The output from one execution is expected to be used twice: first to ensure
# canonical fields are created within the PDC service instance and second to
# create an application form that use those canonical fields (or existing ones).
#
# Example standard out given a PSV file with two "core" and two "custom" fields:
#
#     { "funderFile": "file1.psv", "funderFieldName": "Organization's Legal Name", "canonicalField": { "label": "Org Name", "shortCode": "orgName", "dataType": "string" } }
#     { "funderFile": "file1.psv", "funderFieldName": "Organization Summary: Summarize your organization's mission and main programs.", "canonicalField": { "label": "Org Mission Statement", "shortCode": "orgMissionStatement", "dataType": "string" } }
#     { "funderFile": "file1.psv", "funderFieldName": "Number of Paid Staff", "canonicalField": { "label": "Number of Paid Staff", "shortCode": "numberOfPaidStaff", "dataType": "number" } }
#     { "funderFile": "file1.psv", "funderFieldName": "Contact Title", "canonicalField": { "label": "Contact Title", "shortCode": "contactTitle", "dataType": "string" } }
#
# Requires gnu coreutils and a pipe-delimited file path as argument 1.
#
# While jq is not strictly required for this script, jq makes it easier to use.
# To create a valid JSON array from this output, pipe to `jq -s`, for example:
#
#     ./extractCanonicalFields.sh file1.psv | jq -s '.'
#
# The pipe-delimited input file is assumed to have these columns in this order:
# Field Type|PDC Field Name|Funder Field Name|Funder Technical Field Name|Funder Field Format
#
# For example, to prepare input data files from spreadsheets, run these:
#
#     xlsx2csv -d '|' file1.xlsx file1.psv
#     xlsx2csv -d '|' file2.xlsx file2.psv
#
# Example that prints one JSON map per line, each with a canonicalField, then
# creates a single valid JSON array of those maps using jq, and stores the
# resulting JSON to file  ../generatedCanonicalFields1.json:
#
#     ./extractCanonicalFields.sh file1.psv | jq -s '.' > ../generatedCanonicalFields1.json
#
# Example that takes the above output (or the ../generatedCanonicalFields1.json
# included in this repository) and uses jq to create one line per array element
# with the expected PDC canonicalField JSON format and then posts each to the
# locally running PDC service:
#
#     jq -c '.[].canonicalField' ../generatedCanonicalFields1.json | while read data; do curl -H "Content-Type: application/json" --data-binary "${data}" localhost:3000/canonicalFields; done
#
# The above code is also used in postCanonicalFields.sh, equivalent example:
#
#     ./postCanonicalFields.sh ../generatedCanonicalFields1.json localhost:3000/canonicalFields
#
# Example that takes multiple PSV files, for each one calls this script, selects
# only those objects within each file having a non-empty funderFieldName, and
# creates one .applicationForm.json file per original PSV file.
#
#     for f in *.psv
#     do ./extractCanonicalFields.sh $f \
#         | jq -s '.' \
#         | jq '. | map(select(.funderFieldName != "")) | to_entries | .[] | { position: .key, label: .value.funderFieldName, canonicalField: .value.canonicalField }' \
#         | jq -s > $(basename $f).applicationForm.json
#     done

filename=$(basename "${1}")

# Strip header, get core fields and perhaps their data types, JSON-ize.
tail -n +2 "${1}" \
    | grep '^\(Organization\|Proposal\)|[a-zA-Z0-9].*|' \
    | cut -d'|' -f 2,3,5 \
    | grep -v 'NA\||N\/A\||N \/ A' \
    | grep '|' \
    | sed -E 's/([[:space:]])?Org([[:space:]])/\1Organization\2/g' \
    | sed -E 's/(Proposal[[:space:]]*)?([^[:space:]].+[^[:space:]])[[:space:]]*\|[[:space:]]*(.*)[[:space:]]*\|[[:space:]]*([^[:space:]]*).*/{ "funderFile": "", "funderFieldName": "\3", "canonicalField": { "label": "\2", "shortCode": "\2", "dataType": "\4" } }/g' \
    | sed -E "s/\"funderFile\": \"\"/\"funderFile\": \"${filename}\"/g" \
    | sed -E 's/"dataType": "([dD]ouble|Number)"/"dataType": "number"/g' \
    | sed -E 's/"dataType": "(Integer)"/"dataType": "integer"/g' \
    | sed -E '/"dataType": "(number|integer|boolean|object|array)"/! s/"dataType": ".*"/"dataType": "string"/g' \
    | sed -E 's/"shortCode": "[0-9[:space:]\._-]*?([[:alpha:]]+)[[:space:]\.,\/_-]*?([[:alnum:]]+)?[[:space:]\.,\/_-]*?([[:alnum:]]+)?[[:space:]\.,\/_-]*?([[:alnum:]]+)?[[:space:]\.,\/_-]*?([[:alnum:]]+)?[[:space:]\.,\/_-]*?([[:alnum:]]+)?[[:space:]\.,\/_-]*?([[:alnum:]]+)?[[:space:]\.,\/_-]*?([[:alnum:]]+)?[[:space:]\.,\/_-]*?([[:alnum:]]+)?[[:space:]\.,\/_-]*?([[:alnum:]]+)?[[:space:]\.,\/_-]*?([[:alnum:]]+)?[[:space:]\.,\/_-]*?([[:alnum:]]+)?[^\"]*"/"shortCode": "\L\1\u\2\u\3\u\4\u\5\u\6\u\7\u\8\u\9"/g'

tail -n +2 "${1}" \
    | grep -v '^\(Organization\|Proposal\)|[a-zA-Z0-9].*|' \
    | cut -d'|' -f 3,5 \
    | grep -v '||' \
    | grep -v 'NA\|N\/A\|N \/ A' \
    | grep '|' \
    | sed -E 's/([[:space:]])?Org([[:space:]])/\1Organization\2/g' \
    | sed -E 's/(Proposal[[:space:]]*)?([^[:space:]].+[^[:space:]])[[:space:]]*\|[[:space:]]*([^[:space:]]*).*/{ "funderFile": "", "funderFieldName": "\2", "canonicalField": { "label": "\2", "shortCode": "\2", "dataType": "\3" } }/g' \
    | sed -E "s/\"funderFile\": \"\"/\"funderFile\": \"${filename}\"/g" \
    | sed -E 's/"dataType": "([dD]ouble|Number)"/"dataType": "number"/g' \
    | sed -E 's/"dataType": "(Integer)"/"dataType": "integer"/g' \
    | sed -E '/"dataType": "(number|integer|boolean|object|array)"/! s/"dataType": ".*"/"dataType": "string"/g' \
    | sed -E 's/"shortCode": "[0-9[:space:]\._-]*?([[:alpha:]]+)[[:space:]\.,\/\?\(\)\&\$:’_-]*?([[:alnum:]]+)?[[:space:]\.,\/\?\(\)\&\$:’_-]*?([[:alnum:]]+)?[[:space:]\.,\/\?\(\)\&\$:’_-]*?([[:alnum:]]+)?[[:space:]\.,\/\?\(\)\&\$:’_-]*?([[:alnum:]]+)?[[:space:]\.,\/\?\(\)\&\$:’_-]*?([[:alnum:]]+)?[[:space:]\.,\/\?\(\)\&\$:’_-]*?([[:alnum:]]+)?[[:space:]\.,\/\?\(\)\&\$:’_-]*?([[:alnum:]]+)?[[:space:]\.,\/\?\(\)\&\$:’_-]*?([[:alnum:]]+)?[[:space:]\.,\/\?\(\)\&\$:’_-]*?([[:alnum:]]+)?[[:space:]\.,\/\?\(\)\&\$:’_-]*?([[:alnum:]]+)?[[:space:]\.,\/\?\(\)\&\$:’_-]*?([[:alnum:]]+)?[^\"]*"/"shortCode": "\L\1\u\2\u\3\u\4\u\5\u\6\u\7\u\8\u\9"/g'
