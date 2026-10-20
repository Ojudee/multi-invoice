/**
 * Dedicated Invoice Printing Utility
 * Handles isolated iframe printing, direct system print dialog, and fallbacks.
 */

export function printInvoiceElement(
  targetElementId: string = 'univision-invoice-preview-sheet',
  docTitle: string = 'Univision Official Schedule'
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const target =
        document.getElementById(targetElementId) ||
        document.getElementById('architectural-schedule-printable-sheet') ||
        document.getElementById('structural-engineering-printable-sheet') ||
        document.getElementById('boq-schedule-printable-sheet') ||
        document.getElementById('univision-invoice-sheet') ||
        document.getElementById('univision-invoice-render-target') ||
        document.getElementById('univision-invoice-print-sheet');

      if (!target) {
        try {
          window.print();
        } catch {}
        resolve(false);
        return;
      }

      // Clean up any existing print iframe
      const oldFrame = document.getElementById('univision-print-iframe');
      if (oldFrame) {
        oldFrame.remove();
      }

      // Create hidden iframe for isolated print
      const iframe = document.createElement('iframe');
      iframe.id = 'univision-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      iframe.style.border = 'none';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.setAttribute('aria-hidden', 'true');
      iframe.setAttribute('title', docTitle);
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!frameDoc) {
        try {
          window.print();
        } catch {}
        resolve(true);
        return;
      }

      // Gather stylesheets
      const styleNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((node) => node.outerHTML)
        .join('\n');

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <title>${docTitle}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Caveat:wght@600&family=Playfair+Display:ital,wght@1,500;1,700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
            ${styleNodes}
            <style>
              @page {
                size: A4 portrait;
                margin: 6mm auto;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
              }
              .invoice-paper-sheet,
              #architectural-schedule-printable-sheet,
              #structural-engineering-printable-sheet,
              #boq-schedule-printable-sheet,
              .printable-sheet {
                box-shadow: none !important;
                border: none !important;
                margin: 0 auto !important;
                padding: 16px !important;
                width: 100% !important;
                max-width: 194mm !important;
                background: #ffffff !important;
                box-sizing: border-box !important;
              }
              .no-print,
              button,
              .print\\:hidden {
                display: none !important;
              }
            </style>
          </head>
          <body>
            <div style="display:flex; justify-content:center; width:100%; padding:0; margin:0;">
              ${target.outerHTML}
            </div>
          </body>
        </html>
      `;

      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (iframeErr) {
          console.warn('Iframe print dialog failed, falling back to window.print', iframeErr);
          try {
            window.print();
          } catch {}
          resolve(false);
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 3000);
        }
      }, 300);
    } catch (err) {
      console.warn('Print helper error', err);
      try {
        window.print();
      } catch {}
      resolve(false);
    }
  });
}
