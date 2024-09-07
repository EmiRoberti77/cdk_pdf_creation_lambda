import Ajv, { JSONSchemaType } from "ajv";
import { ReportParams } from "../model";
const ajv = new Ajv();

const schema: JSONSchemaType<ReportParams> = {
  type: "object",
  properties: {
    bucketName: { type: "string" },
    filename: { type: "string" },
    documentBody: { type: "string" },
    sendEmail: { type: "boolean" },
    toAddresses: {
      type: "array",
      items: {
        type: "string",
      },
    },
    fromAddress: { type: "string" },
    emailSubject: { type: "string" },
    emailBody: { type: "string" },
  },
  required: [
    "documentBody",
    "emailBody",
    "bucketName",
    "filename",
    "fromAddress",
    "sendEmail",
    "emailSubject",
    "toAddresses",
  ],
  additionalProperties: false,
};

export const validateReportRequest = ajv.compile(schema);
