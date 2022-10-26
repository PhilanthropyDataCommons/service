#!/bin/bash

# Takes xlsx, transforms the data to JSON, and posts an applicationForm to PDC.
#
# Example usage: ./buildApplicationForm.sh file1.xlsx http://localhost:3000/
#
# Requires the following:
# GNU coreutils, xlsx2csv, curl, jq, extractCanonicalFields.sh, and
# postCanonicalFields.sh.
#
# This script is expected to be run from the directory also containing the two
# other bash scripts above.
#
# Argument 1 is a path to an xlsx file.
# Argument 2 is a URL for a PDC service instance.
#
# The xlsx file is expected to have exactly one sheet and particular columns.
# Here are the expected columns in the given xlsx file, in this order:
# Field Type|PDC Field Name|Funder Field Name|Funder Technical Field Name|Funder Field Format
#
# The high-level steps this script takes:
# 1. Extract canonical fields and application form data from the xlsx file.
# 2. Post all the canonical fields found in the data to the PDC instance.
# 3. Get the PDC instance's canonical fields.
# 4. Match the PDC instance's canonical fields to the application form fields.
# 5. Create an application form in the PDC instance.
#
# Several intermediate files will be created from the xlsx file along the way:
# 1. A pipe-separated values (PSV) version of the original spreadsheet.
# 2. A JSON file containing all possible canonical fields and form fields.
# 3. A JSON file containing only those fields having form field labels.
# 4. A JSON file containing all canonical fields in the PDC instance.
# 5. A JSON file containing the merged fields ready for /applicationForms.

set -eo pipefail

psvFile=$(basename "${1}").psv
allFieldsFile="${psvFile}.allFields.json"
formFieldsFile="${psvFile}.applicationFormFields.json"
canonicalFieldsUrl="${2}/canonicalFields"
joinedFormFieldsFile="${psvFile}.joinedApplicationFormFields.json"
echo -n "About to read \"${1}\", write \"${psvFile}\", write \"${allFieldsFile}\", "
echo -n "write \"${formFieldsFile}\", and use URL \"${canonicalFieldsUrl}\" to "
echo "create canonicalFields."
xlsx2csv -d '|' "${1}" "${psvFile}"
./extractCanonicalFields.sh "${psvFile}" | jq -s '.' > "${allFieldsFile}"
jq '. | map(select(.funderFieldName != "")) | to_entries | .[] | { position: .key, label: .value.funderFieldName, canonicalField: .value.canonicalField }' "${allFieldsFile}" | jq -s '.' > "${formFieldsFile}"
./postCanonicalFields.sh "${allFieldsFile}" "${canonicalFieldsUrl}"

allCanonicalFields=$(curl "${canonicalFieldsUrl}")
allCanonicalFieldsForMergeFile="allCanonicalFieldsForMerge.json"

# Use the shortCode from each application form field to look up the id of the
# corresponding canonical field in this particular PDC instance.

# Make the list of canonical fields have a similar structure to the formFields.
# This is in preparation for the next step (join).
echo "${allCanonicalFields}" \
    | jq '.[] | { canonicalField: . }' \
    | jq -s '.' > "${allCanonicalFieldsForMergeFile}"

# Join the two together on shortCode, drop everything but the important stuff.
# Special thanks to the answer at the following URL:
# https://stackoverflow.com/questions/49037956/how-to-merge-arrays-from-two-files-into-one-array-with-jq/#49039053
jq -c -s 'flatten | group_by(.canonicalField.shortCode) | map(reduce .[] as $x ({}; . * $x)) | .[] | { canonicalFieldId: .canonicalField.id, position: .position, label: .label } | select(.position != null)' \
    "${allCanonicalFieldsForMergeFile}" \
    "${formFieldsFile}" \
    | jq -s '. | sort_by(.position)' \
    > "${joinedFormFieldsFile}"

# Create an opportunity in the PDC instance.
opportunity=$(curl -H "Content-Type: application/json" --data-binary "{ \"title\": \"Opportunity from ${psvFile}\" }" "${2}/opportunities")
opportunityId=$(echo "$opportunity" | jq '.id')

# Use the opportunityId and joined fields to post a new application form.
applicationFormData="{ \"opportunityId\": ${opportunityId}, \"fields\": $(cat "${joinedFormFieldsFile}") }"
applicationForm=$(curl -H "Content-Type: application/json" --data-binary "${applicationFormData}" "${2}/applicationForms")
applicationFormId=$(echo "$applicationForm" | jq '.id')
echo "Successfully created applicationForm with id=${applicationFormId}"
