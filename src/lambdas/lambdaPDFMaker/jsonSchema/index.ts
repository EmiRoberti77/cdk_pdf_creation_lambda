import Ajv, { JSONSchemaType } from 'ajv';
import { S3ImageRoomPath, ReportItem, ReportParams } from '../model';
const ajv = new Ajv();
const s3ImagePathsSchema: JSONSchemaType<S3ImageRoomPath> = {
  type: 'object',
  properties: {
    url: { type: 'string' },
    fileName: { type: 'string' },
    bucket: { type: 'string' },
    region: { type: 'string' },
  },
  required: ['url', 'bucket', 'fileName', 'region'],
  additionalProperties: false,
};
const reportItemSchema: JSONSchemaType<ReportItem> = {
  type: 'object',
  properties: {
    room: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    labels: {
      type: 'array',
      items: { type: 'string' },
    },
    image: { type: 'string', nullable: true },
    s3ImageRoomPath: {
      type: 'object',
      properties: s3ImagePathsSchema.properties,
      required: s3ImagePathsSchema.required,
      additionalProperties: false,
    },
  },
  required: ['room', 'title', 'description', 'labels', 's3ImageRoomPath'],
  additionalProperties: false,
};

const schema: JSONSchemaType<ReportParams> = {
  type: 'object',
  properties: {
    bucketName: { type: 'string' },
    filename: { type: 'string' },
    documentBody: {
      type: 'array',
      items: reportItemSchema,
    },
    sendEmail: { type: 'boolean' },
    toAddresses: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    fromAddress: { type: 'string' },
    emailSubject: { type: 'string' },
    emailBody: { type: 'string' },
  },
  required: [
    'documentBody',
    'emailBody',
    'bucketName',
    'filename',
    'fromAddress',
    'sendEmail',
    'emailSubject',
    'toAddresses',
  ],
  additionalProperties: false,
};

export const validateReportRequest = ajv.compile(schema);
