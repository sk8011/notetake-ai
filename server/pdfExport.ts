import puppeteer from "puppeteer";
import { Buffer } from "buffer";

export async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdfArrayBuffer = await page.pdf({
    format: 'letter',
    printBackground: true,
    margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
  });

  const pdfBuffer = Buffer.from(pdfArrayBuffer);

  await browser.close();
  return pdfBuffer;
}
