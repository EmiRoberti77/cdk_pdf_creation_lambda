import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ReportItem, ReportParams } from '../model';

export class PdfHandler {
  private reportParams: ReportParams;
  private title: string;
  constructor(title: string, reportParams: ReportParams) {
    this.reportParams = reportParams;
    this.title = title;
  }

  public async createPdf(): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const timesNewRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    // Create a page in the PDF
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    let fontSize = 30;
    let yPosition = height - 50; // Start position for content

    // Draw the title at the top
    page.drawText(this.title, {
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
    this.reportParams.documentBody.forEach((item) => {
      // Draw the report title
      page.drawText(item.title, {
        x: 50,
        y: yPosition,
        size: fontSize,
        font: timesNewRomanFont,
        color: rgb(0, 0.53, 0.71),
      });

      yPosition -= 1.5 * fontSize;

      page.drawText(item.s3ImageRoomPath.fileName, {
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
  }
}
