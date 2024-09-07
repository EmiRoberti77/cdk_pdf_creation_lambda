# PDF Generator Lambda Function

This AWS Lambda function generates a PDF file based on a request body and uploads it to an S3 bucket. The function expects a POST request with a JSON body containing the target S3 bucket name, file name, and the content for the PDF.

## Table of Contents

- [Requirements](#requirements)
- [Setup](#setup)
- [Functionality](#functionality)
- [API Endpoint](#api-endpoint)
- [Request Example](#request-example)
- [Response Example](#response-example)
- [Error Handling](#error-handling)

## Requirements

Ensure you have the following installed:

- AWS SDK v3 (`@aws-sdk/client-s3`)
- pdf-lib (`pdf-lib`)
- Node.js (v14 or above)

## Setup

1. Install the dependencies:

   ```bash
   npm install @aws-sdk/client-s3 pdf-lib
   ```

   Functionality

The Lambda function works as follows:

    1.	Request Validation:
    •	The function only accepts POST requests. If a non-POST request is sent, it returns a 404 error with a message stating that the method must be POST.
    •	The function expects a request body containing a JSON object with the bucketName, filename, and body fields. If the request body is missing, it returns a 404 error with a message stating that the body is missing.
    2.	PDF Generation:
    •	The createPdf function generates a PDF with the provided body text.
    •	The PDF is generated using the pdf-lib library and uses the Times New Roman font with text color in RGB.
    3.	Uploading to S3:
    •	The generated PDF is uploaded to the specified S3 bucket with the specified file name.
    •	The function returns a success response containing the URL of the uploaded file in S3.

```json
{
  "bucketName": "emibucketai",
  "filename": "emi_pdf.pdf",
  "documentBody": "Room 123 checkout report",
  "sendEmail": true,
  "toAddresses": ["emiroberti@icloud.com"],
  "fromAddress": "emiroberti@icloud.com",
  "emailSubject": "Room checkout report",
  "emailBody": "Room 123 check out report [site 1]"
}
```

# Dependencies

- AWS SDK v3: To interact with AWS S3 and SES.
- pdf-lib: To generate PDFs programmatically.
- AJV: JSON Schema Validator to ensure the request payload is valid.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template
