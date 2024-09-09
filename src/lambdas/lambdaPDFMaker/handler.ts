import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { HTTP_CODE, HTTP_METHOD, jsonApiProxyResultResponse } from '../util';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
    const pdfBytes = await createPdf('Apartment Report', report.documentBody);
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: pdfBytes,
      ContentType: APPLICATION_JSON,
    };
    const s3Client = new S3Client({ region: REGION });
    const response = await s3Client.send(new PutObjectCommand(params));
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
        toAdresses: report.toAddresses,
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

const createPdf = async (
  title: string,
  body: ReportItem[]
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const timesNewRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  // Create a page in the PDF
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  let fontSize = 30;
  let yPosition = height - 50; // Start position for content

  // Draw the title at the top
  page.drawText(title, {
    x: 50,
    y: yPosition,
    size: fontSize,
    font: timesNewRomanFont,
    color: rgb(0, 0.53, 0.71),
  });

  // Reduce y position to make space for the description
  fontSize = 14;
  yPosition -= 2 * fontSize;

  // Iterate through the body array to add each report item
  body.forEach((item) => {
    // Draw the report title
    page.drawText(item.title, {
      x: 50,
      y: yPosition,
      size: fontSize,
      font: timesNewRomanFont,
      color: rgb(0, 0.53, 0.71),
    });

    // Reduce y position for the description
    yPosition -= 1.5 * fontSize;

    // Draw the description
    page.drawText(item.description, {
      x: 50,
      y: yPosition,
      size: 12,
      font: timesNewRomanFont,
      color: rgb(0, 0, 0),
    });

    // Reduce y position for labels
    yPosition -= 2 * fontSize;

    // Draw table headers for the labels
    page.drawText('Labels:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: timesNewRomanFont,
      color: rgb(0, 0, 0),
    });

    // Move down for table content
    yPosition -= 1.5 * fontSize;

    // Create a simple table for labels
    const labelColumnWidth = 150;
    item.labels.forEach((label, index) => {
      page.drawText(label, {
        x: 50 + (index % 3) * labelColumnWidth, // Distribute labels in columns
        y: yPosition,
        size: 11,
        font: timesNewRomanFont,
        color: rgb(0, 0, 0),
      });

      // If 3 labels per row, go to the next line
      if ((index + 1) % 3 === 0) {
        yPosition -= 1.5 * fontSize; // Move to the next row
      }
    });

    // Add some space between items
    yPosition -= 3 * fontSize;
  });

  // Save the PDF and return as Uint8Array
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
