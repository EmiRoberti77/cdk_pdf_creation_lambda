import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { HTTP_CODE, HTTP_METHOD, jsonApiProxyResultResponse } from '../util';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { SESService } from '../../ses_service';
import { validateReportRequest } from './jsonSchema';
import { ReportItem, ReportParams } from './model';
import {
  APPLICATION_JSON,
  ERR_HTTP_METHOD_NOT_POST,
  ERR_MISSING_BODY,
  HTTPS,
  REGION,
  S3_AMAZON_AWS,
} from '../../constants';
import { PdfHandler } from './pdfHandler';
import { S3Handler } from './s3Handler';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(event.body);
  if (event.httpMethod !== HTTP_METHOD.POST) {
    return jsonApiProxyResultResponse(HTTP_CODE.NOT_FOUND, {
      success: false,
      message: ERR_HTTP_METHOD_NOT_POST,
    });
  }
  if (!event.body) {
    return jsonApiProxyResultResponse(HTTP_CODE.NOT_FOUND, {
      success: false,
      message: ERR_MISSING_BODY,
    });
  }
  try {
    const payload: any = JSON.parse(event.body);
    if (!validateReportRequest(payload)) {
      return jsonApiProxyResultResponse(HTTP_CODE.NOT_FOUND, {
        success: false,
        message: validateReportRequest.errors,
      });
    }
    const report: ReportParams = payload;
    const bucketName = report.bucketName;
    const fileName = report.filename;
    const pdfHandler = new PdfHandler('Apartment Report', report);
    await pdfHandler.initPdf();
    const pdfBytes = await pdfHandler.createPdf();
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: pdfBytes,
      ContentType: APPLICATION_JSON,
    };
    const s3Client = new S3Client({ region: REGION });
    const response = await s3Client.send(new PutObjectCommand(params));
    const s3Handler = new S3Handler();
    const pdfSaved = await s3Handler.put({
      Bucket: bucketName,
      Key: fileName,
      Body: pdfBytes,
      ContentType: APPLICATION_JSON,
    });
    let emailSent = false;
    const pdfUrl = fileUrl(bucketName, fileName);
    if (report.sendEmail) {
      const sesService = new SESService({
        subjectData: report.emailSubject,
        bodyData: `${report.emailBody}, ${pdfUrl}`,
        source: report.fromAddress,
        toAddresses: report.toAddresses,
      });
      emailSent = await sesService.sendEmail();
    }

    return jsonApiProxyResultResponse(HTTP_CODE.OK, {
      success: true,
      report: {
        dateTime: new Date().toISOString(),
        fileUrl: pdfUrl,
        emailSent,
        toAddresses: report.toAddresses,
      },
    });
  } catch (err: any) {
    return jsonApiProxyResultResponse(HTTP_CODE.OK, {
      success: false,
      body: err.message,
    });
  }
};

const fileUrl = (bucketName: string, fileName: string) => {
  return `${HTTPS}${bucketName}${S3_AMAZON_AWS}${fileName}`;
};
