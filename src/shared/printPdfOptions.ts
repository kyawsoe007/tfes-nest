export const printPdfOptions = () => {
  return {
    format: 'Letter',
    border: '5mm',
    printBackground: true,
    base: 'http://localhost:3001/',
    footer: {
      height: '20mm',
      contents: {
        default:
          '<div id="pageFooter" style="text-align: center; font-size: 8px"><div>This is a computer-generated document. No signature is required.</div>{{page}}/{{pages}}</div>',
      },
    },
  };
};

export const printPdfOptionsLandscape = () => {
  return {
    format: 'Letter',
    border: '5mm',
    printBackground: true,
    base: 'http://localhost:3001/',
    orientation: 'landscape',
    footer: {
      height: '20mm',
      contents: {
        default:
          '<div id="pageFooter" style="text-align: center; font-size: 8px"><div>This is a computer-generated document. No signature is required.</div>{{page}}/{{pages}}</div>',
      },
    },
  };
};


