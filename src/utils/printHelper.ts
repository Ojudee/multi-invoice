import { toPng } from 'html-to-image';

/**
 * Prints a high-resolution snapshot of the rendered document so print output
 * matches the preview instead of reflowing the application UI for paper.
 */
export async function printInvoiceElement(
  targetElementId: string = 'univision-invoice-preview-sheet',
  docTitle: string = 'Univision Official Schedule'
): Promise<boolean> {
  const target =
    document.getElementById(targetElementId) ||
    document.getElementById('architectural-schedule-printable-sheet') ||
    document.getElementById('structural-engineering-printable-sheet') ||
    document.getElementById('boq-schedule-printable-sheet') ||
    document.getElementById('univision-invoice-sheet') ||
    document.getElementById('univision-invoice-render-target') ||
    document.getElementById('univision-invoice-print-sheet');

  if (!target) {
    console.error('Print target not found.');
    return false;
  }

  let iframe: HTMLIFrameElement | null = null;
  try {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const snapshot = await toPng(target, {
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      cacheBust: true,
      filter: (node) => !(node instanceof HTMLElement && node.classList.contains('no-print')),
    });

    const oldFrame = document.getElementById('univision-print-iframe');
    oldFrame?.remove();

    iframe = document.createElement('iframe');
    iframe.id = 'univision-print-iframe';
    iframe.title = docTitle;
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.bottom = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentDocument;
    const frameWindow = iframe.contentWindow;
    if (!frameDoc || !frameWindow) {
      throw new Error('Unable to create the isolated print document.');
    }

    frameDoc.open();
    frameDoc.write(`<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${docTitle}</title>
          <style>
            @page { size: auto; margin: 0; }
            html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              background: #fff;
              overflow: hidden;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            img {
              display: block;
              width: auto;
              height: auto;
              max-width: 100vw;
              max-height: 100vh;
              object-fit: contain;
            }
            @media print {
              html, body { width: 100%; height: 100%; }
              img { max-width: 100%; max-height: 100%; }
            }
          </style>
        </head>
        <body><img alt="${docTitle}" src="${snapshot}"></body>
      </html>`);
    frameDoc.close();

    const image = frameDoc.querySelector('img');
    if (!image) throw new Error('Unable to load the captured print preview.');
    if (!image.complete) {
      await new Promise<void>((resolve, reject) => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => reject(new Error('Captured print preview failed to load.')), {
          once: true,
        });
      });
    }

    frameWindow.addEventListener(
      'afterprint',
      () => {
        iframe?.remove();
      },
      { once: true }
    );
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(() => iframe?.remove(), 60000);
    return true;
  } catch (error) {
    console.error('Unable to prepare exact-preview print output.', error);
    iframe?.remove();
    return false;
  }
}
