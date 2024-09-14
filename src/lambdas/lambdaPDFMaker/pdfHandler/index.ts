import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import { ReportItem, ReportParams } from '../model';
import { S3Handler } from '../s3Handler';
import { PDFNotInitializedException } from './exceptions/PDFNotInitializedException';

export class PdfHandler {
  private reportParams: ReportParams;
  private pdfDoc: PDFDocument | undefined;
  private title: string;
  private timesNewRomanFont: PDFFont;
  private fontSize = 30;
  private yPosition = 0;
  constructor(title: string, reportParams: ReportParams) {
    this.reportParams = reportParams;
    this.title = title;
    this.fontSize = 30;
    this.yPosition = 0;
  }

  public async initPdf(): Promise<void> {
    this.pdfDoc = await PDFDocument.create();
  }

  public async createPdf(): Promise<Uint8Array> {
    if (!this.pdfDoc) throw new PDFNotInitializedException();
    this.timesNewRomanFont = await this.setFont();
    await this.createTitlePage();
    await this.addRoomsPages();
    return await this.closePdf();
  }

  private async closePdf() {
    if (!this.pdfDoc) throw new PDFNotInitializedException();
    // Save the PDF and return as Uint8Array
    const pdfBytes = await this.pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private async setFont(): Promise<PDFFont> {
    if (!this.pdfDoc) {
      throw new PDFNotInitializedException();
    }
    return await this.pdfDoc.embedFont(StandardFonts.TimesRoman);
  }

  private async createTitlePage(): Promise<void> {
    if (!this.pdfDoc) throw new PDFNotInitializedException();

    const page = this.pdfDoc.addPage();
    const { width, height } = page.getSize();
    this.fontSize = 30;
    this.yPosition = height - 50;

    // Draw the title at the top
    page.drawText(this.title, {
      x: 50,
      y: this.yPosition,
      size: this.fontSize,
      font: this.timesNewRomanFont,
      color: rgb(0, 0.53, 0.71),
    });

    // Reduce y position to make space for the description
    this.fontSize = 14;
    this.yPosition -= 2 * this.fontSize;

    page.drawText('Report produced by ODIN AI', {
      x: 50,
      y: this.yPosition,
      size: this.fontSize,
      font: this.timesNewRomanFont,
      color: rgb(0, 0.53, 0.71),
    });
  }

  private async addRoomsPages(): Promise<void> {
    if (!this.pdfDoc) throw new PDFNotInitializedException();

    for (const item of this.reportParams.documentBody) {
      await this.addPage(item);
    }
  }

  private async addPage(item: ReportItem) {
    if (!this.pdfDoc) throw new PDFNotInitializedException();

    let page = this.pdfDoc.addPage();
    const { height } = page.getSize();
    const fontSize = 30;
    const initialPageMargin = fontSize + 15;
    const textTopPosition = height - initialPageMargin;
    const imageTopPosition = textTopPosition - 15;
    const imageSize = {
      h: 400,
      w: 350,
    };

    // Draw the report title
    page.drawText(item.title, {
      x: 50,
      y: textTopPosition,
      size: fontSize,
      font: this.timesNewRomanFont,
      color: rgb(0, 0.53, 0.71),
    });

    //push y position down the page
    let yPosition = textTopPosition - 1.5 * this.fontSize;

    //read image from s3
    const s3Handler = new S3Handler();
    const roomImage = await s3Handler.get({
      Bucket: this.reportParams.bucketName,
      Key: item.s3ImageRoomPath.fileName,
    });

    if (roomImage) {
      const imageEmbed = await this.pdfDoc.embedJpg(roomImage);
      const imageDims = imageEmbed.scale(0.7);

      //prepare position for the image
      yPosition = imageTopPosition - imageSize.h;

      page.drawImage(imageEmbed, {
        x: 50,
        y: yPosition,
        height: imageSize.h,
        width: imageSize.w,
      });

      //lower yPosition for the image description
      yPosition -= 1.5 * fontSize;
    }

    // Draw the description below the image
    page.drawText(item.description, {
      x: 50,
      y: yPosition,
      size: 12,
      font: this.timesNewRomanFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 1.5 * this.fontSize; // Move down for label section

    // Draw table headers for the labels
    // if (this.yPosition - 1.5 * this.fontSize < marginBottom) {
    //   page = this.pdfDoc.addPage(); // Add a new page if space is insufficient
    //   this.yPosition = imageTopPosition; // Reset yPosition
    // }

    // Draw table headers for the labels
    page.drawText('Items:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: this.timesNewRomanFont,
      color: rgb(0, 0, 0),
    });

    // Move down for table content
    yPosition -= 1.5 * this.fontSize;

    // Create a simple table for labels
    const labelColumnWidth = 150;
    item.labels.forEach((label, index) => {
      page.drawText(label, {
        x: 50 + (index % 3) * labelColumnWidth, // Distribute labels in columns
        y: yPosition,
        size: 11,
        font: this.timesNewRomanFont,
        color: rgb(0, 0, 0),
      });

      // If 3 labels per row, go to the next line
      if ((index + 1) % 3 === 0) {
        yPosition -= 1.5 * this.fontSize; // Move to the next row
      }
    });
  }
}
