export interface BucketParams {
  bucketName: string;
  filename: string;
  sendEmail: boolean;
  documentBody: ReportItem[];
}
export interface ReportItem {
  room: string;
  title: string;
  description: string;
  labels: string[];
  image?: any;
}
export interface SESParams {
  toAddresses: string[];
  fromAddress: string;
  emailSubject: string;
  emailBody: string;
}

export interface ReportParams extends BucketParams, SESParams {}
