import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput,
} from '@aws-sdk/client-ses';
import { SESServiceParams } from './model/sesServiceParams';
import { REGION } from '../constants';

export class SESService {
  private sesClient: SESClient;
  private sesServiceParams: SESServiceParams;
  constructor(sesServiceParams: SESServiceParams) {
    this.sesClient = new SESClient({ region: REGION });
    this.sesServiceParams = sesServiceParams;
  }

  async sendEmail(): Promise<any> {
    try {
      const sendEmailParams: SendEmailCommandInput = {
        Destination: {
          ToAddresses: this.sesServiceParams.toAddresses,
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: this.sesServiceParams.bodyData,
            },
          },
          Subject: {
            Data: this.sesServiceParams.subjectData,
            Charset: 'UTF-8',
          },
        },
        Source: this.sesServiceParams.source,
        //add returnPath for emails that bounce
      };
      const response = await this.sesClient.send(
        new SendEmailCommand(sendEmailParams)
      );
      console.log(response);
      this.sesClient.destroy();
      return true;
    } catch (err: any) {
      console.error(err);
      return false;
    }
  }
}
