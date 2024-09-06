import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HTTP_CODE, HTTP_METHOD, jsonApiProxyResultResponse } from "../util";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { SESService } from "../../ses_service";
export interface PDFRequest {
  bucketName: string;
  filename: string;
  body: string;
  sendEmail: boolean;
}
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== HTTP_METHOD.POST) {
    return jsonApiProxyResultResponse(HTTP_CODE.NOT_FOUND, {
      success: false,
      message: "Error:httpMethod must be POST",
    });
  }
  console.log(event);
  if (!event.body) {
    return jsonApiProxyResultResponse(HTTP_CODE.NOT_FOUND, {
      success: false,
      message: "Error:missing body",
    });
  }
  try {
    const pdfRequest: PDFRequest = JSON.parse(event.body);
    const bucketName = pdfRequest.bucketName;
    const fileName = pdfRequest.filename;
    const pdfBytes = await createPdf(pdfRequest.body);
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: pdfBytes,
      ContentType: "application/pdf",
    };
    const s3Client = new S3Client({ region: "us-east-1" });
    const response = await s3Client.send(new PutObjectCommand(params));
    let emailSent = false;
    const pdfUrl = fileUrl(bucketName, fileName);
    if (pdfRequest.sendEmail) {
      const sesService = new SESService({
        subjectData: "Rooms Checkout Report",
        bodyData: `${pdfUrl}`,
        source: "emiroberti@icloud.com",
        toAddresses: ["emiroberti@icloud.com"],
      });
      emailSent = await sesService.sendEmail();
    }

    return jsonApiProxyResultResponse(HTTP_CODE.OK, {
      success: true,
      task: {
        emailSent,
        fileUrl: pdfUrl,
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
  return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
};

const createPdf = async (body: string): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const timesNewRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const fontSize = 30;
  page.drawText(body, {
    x: 50,
    y: height - 4 * fontSize,
    size: fontSize,
    font: timesNewRomanFont,
    color: rgb(0, 0.53, 0.71),
  });
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
