# UGC-NET Score Checker — One Upload

The user only uploads the Digialm response-sheet PDF.

The 150-question answer key supplied for this UGC-NET paper is embedded directly in `app.js`, so there is no answer-key upload.

## Run locally

Open `index.html` in Chrome/Edge.

## GitHub Pages

Upload `index.html`, `style.css`, and `app.js` to a GitHub repository and enable GitHub Pages.

## Notes

- PDF.js extracts text when possible.
- If the PDF is image-only, Tesseract.js performs OCR in the browser.
- The response PDF is not uploaded to a server.
- The embedded key is specifically the 150-question key supplied for this app.
- Scanned 100+ page PDFs can take several minutes to OCR.
