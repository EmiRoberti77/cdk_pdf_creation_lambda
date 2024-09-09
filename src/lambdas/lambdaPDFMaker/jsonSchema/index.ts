import Ajv, { JSONSchemaType } from 'ajv';
import { ReportItem, ReportParams } from '../model';
const ajv = new Ajv();
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
    image: { type: 'object', nullable: true }, // Optional image field (can be any type or null)
  },
  required: ['room', 'title', 'description', 'labels'],
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
