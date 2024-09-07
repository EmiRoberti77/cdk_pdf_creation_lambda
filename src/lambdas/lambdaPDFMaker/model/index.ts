export interface BucketParams {
  bucketName: string;
  filename: string;
  sendEmail: boolean;
  documentBody: string;
}

export interface SESParams {
  toAddresses: string[];
  fromAddress: string;
  emailSubject: string;
  emailBody: string;
}

export interface ReportParams extends BucketParams, SESParams {}
