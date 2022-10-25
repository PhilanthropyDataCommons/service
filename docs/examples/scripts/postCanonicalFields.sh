# Posts canonical fields from JSON file (arg1) to URL (arg2)
#
# Expected format of the JSON file is an array with map elements each with a key
# named "canonicalField" and value that is a map of elements each with keys
# named "label", "shortCode", and "dataType", all strings.
#
# Example input file contents with two canonical fields, one in each map:
# [
#   {
#     "canonicalField": {
#       "label": "some label",
#       "shortCode": "someShortCode",
#       "dataType": "number"
#     },
#     "ignoredOrUnimportantKey": "ignoredValue"
#   },
#   {
#     "canonicalField" {
#       "label": "another label",
#       "shortCode": "anotherShortCode",
#       "dataType": "boolean"
#     },
#     "ignoredOrUnimportantKey": "anotherIgnoredValue"
#   }
# ]
#
# Requires GNU coreutils, curl, and jq.
#
# Argument 1 is the path to such a file as shown above.
# Argument 2 is the full URL to the canonicalFields endpoint,
# for example http://localhost:3000/canonicalFields.

cat $1 | jq -c '.[].canonicalField' | while read data; do curl -H "Content-Type: application/json" --data-binary "${data}" $2; done
