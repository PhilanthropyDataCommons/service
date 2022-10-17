#!/bin/bash

# This script creates PDC-compatible JSON objects from pipe-separated files.
#
# Example output given a PSV file with two "core" and two "custom" fields:
#
#     { "label": "Org Name", "shortCode": "Org Name", "dataType": "string" },
#     { "label": "Org Mission Statement", "shortCode": "Org Mission Statement", "dataType": "string" },
#     { "label": "Number of Paid Staff", "shortCode": "a3603d12-8635-483c-8476-69d0ea8429a9", "dataType": "number" },
#     { "label": "Contact Title", "shortCode": "24631004-5979-496e-9bc4-4b32aa24e472", "dataType": "string" },
#
# Requires gnu coreutils and a pipe-delimited file path as argument 1.
# The pipe-delimited file is assumed to have these columns in this order:
# Field Type|PDC Field Name|Funder Field Name|Funder Technical Field Name|Funder Field Format
#
# For example, to prepare data files from spreadsheets, run these:
#
#     xlsx2csv -d '|' file1.xlsx file1.psv
#     xlsx2csv -d '|' file2.xlsx file2.psv
#
# Example that creates a single valid JSON array of canonical field maps,
# pretty-prints it with jq, and stores it in the file ../example.json:
#
#     echo "[ $( for f in *.psv; do ./extractCanonicalFields.sh $f; done | head -c -2 ) ]" | jq > ../generatedCanonicalFields.json
#
# Example that takes the above output (or the ../example.json included in this
# repository) and uses jq to create one line per array element (one map in this
# case) and then posts each to the locally running PDC service:
#
#     jq -c .[] ../generatedCanonicalFields.json | while read data; do curl -H "Content-Type: application/json" --data-binary "${data}" localhost:3000/canonicalFields; done
#
# Example that creates JSON from the PSVs and posts each JSON map to the locally
# running PDC service straightaway without jq and without an intermediate file:
#
#     for f in *.psv; do ./extractCanonicalFields.sh $f; done | sed 's/\(.*\),$/\1/g' | while read data; do curl -H "Content-Type: application/json" --data-binary "${data}" localhost:3000/canonicalFields; done

# Strip header, get core fields and perhaps their data types, JSON-ize.
tail -n +2 $1 \
    | grep '^\(Organization\|Proposal\)|[a-zA-Z0-9].*|' \
    | cut -d'|' -f 2,5 \
    | grep -v '||' \
    | grep -v 'NA\||N\/A\||N \/ A' \
    | grep '|' \
    | sed -E 's/([^[:space:]].+[^[:space:]])[[:space:]]*\|[[:space:]]*([^[:space:]]*).*/{ "label": "\1", "shortCode": "\1", "dataType": "\2" },/g' \
    | sed -E 's/"dataType": "([dD]ouble|[iI]nteger|Number)"/"dataType": "number"/g' \
    | sed -E '/"dataType": "(number|boolean|object|array)"/! s/"dataType": ".*"/"dataType": "string"/g' \

# Strip header, get custom field columns and perhaps their data types, JSON-ize.
tail -n +2 $1 \
    | grep -v '^\(Organization\|Proposal\)|[a-zA-Z0-9].*|' \
    | cut -d'|' -f 3,4,5 \
    | grep -v '||' \
    | grep -v 'NA\|N\/A\|N \/ A' \
    | grep '|' \
    | sed -E 's/([^[:space:]].+[^[:space:]])[[:space:]]*\|(.+[^[:space:]])[[:space:]]*\|[[:space:]]*([^[:space:]]*).*/{ "label": "\1", "shortCode": "\2", "dataType": "\3" },/g' \
    | sed -E 's/"dataType": "([dD]ouble|[iI]nteger|Number)"/"dataType": "number"/g' \
    | sed -E '/"dataType": "(number|boolean|object|array)"/! s/"dataType": ".*"/"dataType": "string"/g' \
