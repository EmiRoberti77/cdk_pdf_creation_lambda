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
  localImage?: string;
  s3ImageRoomPath: S3ImageRoomPath;
}
export interface S3ImageRoomPath {
  url: string;
  fileName: string;
  bucket: string;
  region: string;
}
export interface SESParams {
  toAddresses: string[];
  fromAddress: string;
  emailSubject: string;
  emailBody: string;
}

export interface ReportParams extends BucketParams, SESParams {}
