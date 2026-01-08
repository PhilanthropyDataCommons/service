# File Upload

This details the steps for uploading files using the PDC API, with
more specific instructions for doing so via the Swagger UI at
api.philanthropydatacommons.org.

## Process Overview 

Uploading documents to the database via the PDC API is a multistep
process. It generally involves two major steps:

1. Uploading the file
2. Getting it in the database.

For every file that you wish to upload, you need to first register
file metadata to generate a [presigned
URL](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
to accept the upload. Then, you can upload the file and be given a
file ID for reference in the PDC database as a proposal, an attachment
archive, or a field value.
	 
## File and document types

You can upload files of any type, but proposals and proposal attachments
require special file types.

* Proposals (.csv)
   
   Proposals are uploaded as CSV files, with a header row indicating
   field names.

* Attachments (.zip)

   For proposal fields that take filenames as values, the referenced
   files should be compressed in a ZIP file. The contents of the ZIP
   archive are not limited by file type.
	
## Upload a file

**1. Log into api.philanthropydatacommons.org**

* Click Authorize, and then Authorize again on the pop-up, to log in.

**2. Use the `/files` endpoint to register the metadata for a new
file**

* Make a POST request using the `/files` endpoint.
* Click "Try it out" and modify the request body to reflect your file
  metadata, e.g.

	```json
	{
		"name": "sampleproposal.csv",
		"mimeType": "text/csv",
		"size": 119
	}
	```

* Click "Execute"
* You should receive a response with status 201, of which you need
  only note the `id`, `url`, and `presignedPost` values, e.g.,

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

**3. Upload file with `curl`**

* Use `presignedPost` values to create a `curl` request to the
  response `url` value
* Use the following formatting changes:
  - Each field should be preceded with `-F`
  - The entire key-value pair should be enclosed within double-quotes
  - In each pair, replace the colon `:` with an equal sign `=`
  - Replace the commas between fields with a backslash `\`
* Add fields:
  - `Content-Type` to match the `mimeType` value from above
  - `file` with the path to your file from your working directory
* You should end up with something like this:

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
	-F "file=/path/to/sampleproposal.csv"
```

## Create a new proposal (with attachments)

* In order to create a new proposal in the PDC database, you should
  have already uploaded the proposal CSV file using the instructions
  above.
* If any of the fields take filenames as values, you will also need to
  upload an accompanying attachments archive with all the referenced
  files compressed into a single .zip archive. You should be able to
  do this using the same instructions as above, with the
  mimeType/Content-Type `application/zip`.
* You should have the file IDs for the proposal and archive (if there
  is one) for reference.

**1. Create a Bulk Upload task**

* Make a POST request to `tasks/bulkUploads` to set up a bulk upload
  task, which, when run, will associate your files with each other,
  and place them correctly within the PDC database.
* Click "Try it out"
* Edit the request body to include the data source ID, the code for
  the funder, and the file IDs of the proposal and the attachment
  archive. 
* If you do not know the source ID or funder code, you can
  use a `/source` GET request to see a list of sources and their IDs,
  and `/funders` to get a list of funders and their codes.
 
 ```
  {
	  "sourceId": 1,
	  "funderShortCode": "pdc",
	  "proposalsDataFileId": 67,
	  "attachmentsArchiveFileId": 1
  }
  ```

* You can remove the archive file ID field if you do not have
  attachments. Howevever, you will get get an error if file names are
  referenced in your .csv file and you do not include an attachment
  archive.
* Click "Execute"
* You should receive a response with code 201 that shows the correct
  files and information for the bulk upload. This does not mean the
  upload was successful, only that this is the form of the upload that
  will be attempted.

**2. Confirm bulk upload and proposal**

* Make a GET request to `tasks/bulkUploads` to view the status of your
  upload. (Try it out > Execute)
* If the above status is "completed", you should able to see your
  proposal listed in the response to a GET request to `/proposals` as
  well.

## Attach files to a new ProposalVersion (or field value)

* Upload the files you would like to attach using the method above,
  and note the file ID in the response.
* When creating a POST request with the Swagger UI to
  `/proposalVersions` to add a new proposal version, you can include
  that file ID as the `file` value with any item in `fieldValues`,
  e.g.,

```
{
  "proposalId": 3709,
  "sourceId": 1,
  "applicationFormId": 3529,
  "fieldValues": [
    {
      "value": "string",
      "goodAsOf": "2026-01-09T17:51:08.108Z",
      "applicationFormFieldId": 3613,
      "position": 23
	  "file": 242
    }
  ]
}
```

* You can take a similar approach with POST requests to other
  endpoints which have field values that take a file ID.
