/*
 * Rellena la papeleta S-24-S (REGISTRO DE TRANSACCION) en el navegador.
 * Misma logica que rellenar.py, pero pdf-lib usa origen abajo-izquierda,
 * por eso y = 234 - y_pymupdf (la pagina mide 396 x 234 pt).
 * Funciona tanto en el navegador (window) como en Node (para pruebas).
 */
(function (global, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    global.Rellenar = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var ALTURA_PAGINA = 234;

  // Posiciones (puntos PDF, origen abajo-izquierda)
  // Ajustadas tras inspeccion con zoom: el texto debe apoyarse sobre las
  // lineas punteadas, no cruzarlas ni flotar sobre ellas.
  var FECHA_X = 312.0, FECHA_Y = ALTURA_PAGINA - 43.4;
  var OBRA_Y = ALTURA_PAGINA - 90.6;    // Donaciones (Obra mundial)
  var CONG_Y = ALTURA_PAGINA - 104.9;   // Donaciones (Gastos de la congregacion)
  var TOTAL_Y = ALTURA_PAGINA - 161.9;  // TOTAL:
  var MONTO_X_DER = 357.0;

  // Casilla "Donacion" (se marca con una X)
  var CHECK = [
    { x1: 38.2, y1: ALTURA_PAGINA - 50.9, x2: 44.8, y2: ALTURA_PAGINA - 56.3 },
    { x1: 44.8, y1: ALTURA_PAGINA - 50.9, x2: 38.2, y2: ALTURA_PAGINA - 56.3 }
  ];

  // Lineas de firma: el nombre va apoyado sobre la linea (como al firmar)
  var FIRMA_Y = ALTURA_PAGINA - 183.3;
  var RELLENADO = { x0: 23.6, x1: 193.1 };
  var VERIFICADO = { x0: 203.1, x1: 372.5 };

  function formatearMonto(texto) {
    var digitos = String(texto).replace(/\D/g, "");
    if (!digitos) throw new Error("Monto vacio o sin numeros: " + texto);
    return String(parseInt(digitos, 10)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function montoAEntero(formateado) {
    return parseInt(String(formateado).replace(/\D/g, ""), 10) || 0;
  }

  function b64ABytes(b64) {
    if (typeof Buffer !== "undefined") {
      return new Uint8Array(Buffer.from(b64, "base64"));
    }
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function textoDerecha(page, font, xDer, y, texto, size) {
    var ancho = font.widthOfTextAtSize(texto, size);
    page.drawText(texto, { x: xDer - ancho, y: y, size: size, font: font });
  }

  function textoCentrado(page, font, x0, x1, y, texto, size) {
    var anchoLinea = x1 - x0;
    while (size > 5 && font.widthOfTextAtSize(texto, size) > anchoLinea) size -= 0.5;
    var ancho = font.widthOfTextAtSize(texto, size);
    page.drawText(texto, { x: x0 + (anchoLinea - ancho) / 2, y: y, size: size, font: font });
  }

  /**
   * Genera la papeleta rellenada.
   * PDFLib: el objeto global PDFLib (o require('pdf-lib')).
   * plantillaB64: contenido del S-24_S.pdf en base64.
   * datos: { fecha: 'dd/mm/aaaa', obra: '15.250', congregacion: '23.800',
   *          rellenadoPor: '...', verificadoPor: '...' }
   * Devuelve Uint8Array con el PDF listo.
   */
  async function generarPapeleta(PDFLib, plantillaB64, datos) {
    var pdfDoc = await PDFLib.PDFDocument.load(b64ABytes(plantillaB64));
    var font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    var page = pdfDoc.getPages()[0];
    var negro = PDFLib.rgb(0, 0, 0);

    // 1) Marcar casilla "Donacion" con una X
    CHECK.forEach(function (l) {
      page.drawLine({
        start: { x: l.x1, y: l.y1 }, end: { x: l.x2, y: l.y2 },
        thickness: 1.1, color: negro
      });
    });

    // 2) Fecha
    page.drawText(datos.fecha, { x: FECHA_X, y: FECHA_Y, size: 9, font: font, color: negro });

    // 3) Montos (alineados a la derecha) + total calculado
    var total = formatearMonto(montoAEntero(datos.obra) + montoAEntero(datos.congregacion));
    textoDerecha(page, font, MONTO_X_DER, OBRA_Y, datos.obra, 10);
    textoDerecha(page, font, MONTO_X_DER, CONG_Y, datos.congregacion, 10);
    textoDerecha(page, font, MONTO_X_DER, TOTAL_Y, total, 10);

    // 4) Firmas
    textoCentrado(page, font, RELLENADO.x0, RELLENADO.x1, FIRMA_Y, datos.rellenadoPor, 8);
    textoCentrado(page, font, VERIFICADO.x0, VERIFICADO.x1, FIRMA_Y, datos.verificadoPor, 8);

    return await pdfDoc.save();
  }

  return {
    formatearMonto: formatearMonto,
    montoAEntero: montoAEntero,
    generarPapeleta: generarPapeleta
  };
});
