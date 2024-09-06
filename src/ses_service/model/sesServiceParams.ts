export interface SESServiceParams {
  toAddresses: string[];
  bodyData: any;
  subjectData: string;
  source: string;
  returnPath?: string;
}
