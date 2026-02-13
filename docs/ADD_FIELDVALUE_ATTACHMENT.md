# Uploading attachments to field values

This details the steps for uploading files as attachments to field
values using the PDC API. Note that PDC is unable to act as storage
for any other files except those which will be used as field value
attachments (or as part of the Bulk Upload process).

If you would like to use the Swagger UI to make requests and view their
attendant schema, you can do so at api.philanthropydatacommons.org. You will
need to click Authorize, and then Authorize again on the pop-up to log in.

## Process Overview

Uploading documents to the database via the PDC API is a multistep process.

1. Register file metadata to generate a [presigned post
   URL](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
   and file ID
2. Use `curl` to upload the file
3. Use the revelant POST endpoint to associate the file ID with your desired
   field value

### Create a presigned post URL

**Use the `/files` endpoint to register the metadata for a new file**

- Make a POST request using the `/files` endpoint, e.g.,

  ```json
  {
  	"name": "sampleproposal.csv",
  	"mimeType": "text/csv",
  	"size": 119
  }
  ```

- You should receive a response with status 201, of which you need only note the
  `id` and `presignedPost` values, e.g.,

  ```
  {
  	"id": 67,
  	<...>
  	"presignedPost": {
  		"url": "https://pdc-upload-url/",
  		"fields": {
  			"bucket": "pdc-service-test",
  			"X-Amz-Algorithm": "<...>",
  			"X-Amz-Credential": "<...>",
  			"X-Amz-Date": "20260108T181602Z",
  			"key": "<UUID>",
  			"Policy": "<extremely-long-alphanumeric-string>",
  			"X-Amz-Signature": "<longish-string>"
  			}
  	}
  }
  ```

### Upload file with `curl`

**Use `presignedPost` values to create a `curl` request to the response `url`
value**

- Use the following formatting changes:
  - Each field should be preceded with `-F`
  - The entire key-value pair should be enclosed within double-quotes
  - In each pair, replace the colon `:` with an equal sign `=`
  - Replace the commas between fields with a backslash `\`
- Add fields:
  - `Content-Type` to match the `mimeType` value from above
  - `file` with the path to your file from your working directory
  - Note the `@` following the `=` sign in the file field
- You should end up with something like this:

```bash
	curl https://pdc-upload-url/ \
	-F "bucket=pdc-service-test" \
	-F "X-Amz-Algorithm=<...>" \
	-F "X-Amz-Credential=<...>" \
	-F "X-Amz-Date=20260108T181602Z" \
	-F "key=<UUID>" \
	-F "Policy=<extremely-long-alphanumeric-string>" \
	-F "X-Amz-Signature=<longish-string>" \
	-F "Content-Type=text/csv" \
	-F "file=@/path/to/sampleproposal.csv"
```

You can verify that your file has been successfully uploaded using the
`/files` GET endpoint.

### Associate file ID with a field value

- Make sure you have the file IDs of the files you'd like to
  include.
  - If you need to look up the ID of a recently uploaded file, you
    can use the `/files` GET endpoint.
  - You can also filter the `/files` GET response by uploader,
    including using `me` to get a list of files uploaded with your
    account.
- When posting a new versions of existing items, as with posting new proposal
  versions, **you will need to include all the fields originally included that
  you would like to preserve**, though not as verbosely as the full GET
  response. If you do not include any fields originally in the proposal, it will
  be assumed that you are asking for those fields to be deleted and they will
  not be included in the new proposal version. In order to make sure you know
  what you will be updating, make a GET request to the corresponding endpoint,
  e.g., `/proposals` or `/proposalVersions`.
- Find the schema for the POST request to the endpoint that you would like to use.
- To attach a file to a field value, include your file ID(s) as a string
  (quoted) for `value`. If the field datatype is `file`, the database will
  automatically associate the field value with the corresponding file and
  populate `file` with the correct metadata.
- Below is an example `/proposalVersion` POST request, which includes all field
  values, even though we are only trying to add file ID 76 to the fourth field value.

  ```json
  {
  	"proposalId": 517,
  	"sourceID": 1,
  	"applicationFormId": 40,
  	"fieldValues": [
  		{
  			"value": "name3",
  			"goodAsOf": null,
  			"position": 0,
  			"applicationFormFieldId": 1259
  		},
  		{
  			"value": "org3",
  			"goodAsOf": null,
  			"position": 1,
  			"applicationFormFieldId": 1260
  		},
  		{
  			"value": "addr3",
  			"goodAsOf": null,
  			"position": 2,
  			"applicationFormFieldId": 1261
  		},
  		{
  			"value": "76",
  			"goodAsOf": null,
  			"position": 3,
  			"applicationFormFieldId": 1262
  		}
  	],
  	"applicationFormId": 40
  }
  ```

- Note `goodAsOf` is `null` here, but takes ISO 8601 formatted UTC timestamp.
