// == Google Apps Script backend ==
// 1) Abrí la Hoja de cálculo original (NO la publicada) y ve a Extensiones > Apps Script.
// 2) Pegá este archivo como Code.gs, guardá y completá las constantes de abajo.
// 3) Deploy > Implementar como aplicación web (ejecutar como TU usuario y acceso: Cualquiera con el enlace).
// 4) Copiá la URL y pegala en index.html en APPS_SCRIPT_URL.
// 5) (Opcional) Configurá un disparador de tiempo (diario) para notifyEditorsOfStale().

const SHEET_NAME = 'Hoja 1'; // <-- Cambiar si tu pestaña se llama distinto
const COL = {
  // 1-indexed en GAS
  NOMBRE: 3,        // C
  TELEFONO: 4,      // D
  CONTACTO: 6,      // F (email)
  ETAPA: 24,        // X
  ULTIMA_ACT: 25,   // Y (encabezado 'UltimaActualizacion')
  SEGUIMIENTO: 27   // AA (solo lectura desde frontend)
};
const AUTH = { user: 'DOCENTESBROWN', pass: 'NestorVive' };
const EDITOR_EMAILS = ['tu-editor@ejemplo.com']; // <-- Cambiar por correos de editores a notificar

function _getSheet(){
  const ss = SpreadsheetApp.getActiveSpreadsheet(); // usar script ligado a la hoja
  const sh = ss.getSheetByName(SHEET_NAME);
  if(!sh) throw new Error('No existe la hoja: ' + SHEET_NAME);
  return sh;
}

function doGet(e){
  try{
    const action = (e && e.parameter && e.parameter.action) || 'ping';
    if(action === 'ping'){
      return _json({ ok:true, pong:true });
    }
    if(action === 'stale'){
      const days = parseInt(e.parameter.days||'7',10);
      const items = _findStale(days);
      return _json({ ok:true, items });
    }
    return _json({ ok:false, error:'Acción no soportada' }, 400);
  }catch(err){
    return _json({ ok:false, error: String(err) }, 500);
  }
}

function doPost(e){
  try{
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action;
    if(action === 'updateStage'){
      if(params.user !== AUTH.user || params.pass !== AUTH.pass){
        return _json({ ok:false, error:'No autorizado' }, 403);
      }
      const rowNumber = parseInt(params.rowNumber,10);
      const newStage = String(params.newStage||'');
      const name = String(params.name||'');
      const email = String(params.email||'');

      if(!rowNumber || !newStage){
        return _json({ ok:false, error:'Faltan parámetros' }, 400);
      }

      const sh = _getSheet();
      sh.getRange(rowNumber, COL.ETAPA).setValue(newStage);
      sh.getRange(rowNumber, COL.ULTIMA_ACT).setValue(new Date());

      // Enviar email automático
      if(email){
        const subject = 'Actualización de Agenda';
        const body = 'Buenas, queremos contarte que tu Agenda esta en la ETAPA ' + newStage + ', en cuanto llegue a la etapa "entrega" nos estaremos comunicando en los siguientes días hábiles para coordinar.';
        GmailApp.sendEmail(email, subject, body);
      }

      return _json({ ok:true });
    }
    return _json({ ok:false, error:'Acción no soportada' }, 400);
  }catch(err){
    return _json({ ok:false, error:String(err) }, 500);
  }
}

// Buscar pedidos con más de N días sin cambiar de etapa (basado en ULTIMA_ACT)
function _findStale(minDays){
  const sh = _getSheet();
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if(lastRow < 2) return [];
  const values = sh.getRange(2, 1, lastRow-1, lastCol).getValues(); // asume fila 1 = encabezados
  const out = [];
  const today = new Date();
  for(let i=0;i<values.length;i++){
    const r = values[i];
    const name = r[COL.NOMBRE-1];
    const etapa = r[COL.ETAPA-1];
    const last = r[COL.ULTIMA_ACT-1];
    if(last && last instanceof Date){
      const diff = Math.floor((today - last) / (1000*60*60*24));
      if(diff >= minDays){
        out.push({ index: i+2, name: name||'', stage: etapa||'', days: diff });
      }
    }
  }
  return out;
}

// Disparador diario opcional: notifica por email a editores
function notifyEditorsOfStale(){
  const items = _findStale(7);
  if(!items.length) return;
  const lines = items.map(x => '- ' + x.name + ' ('+x.stage+', '+x.days+' días)').join('\n');
  const subject = 'Pedidos estancados (+7 días)';
  const body = 'Los siguientes pedidos superan 7 días en la misma etapa:\n\n' + lines + '\n\nRevisá el tablero para actualizarlos.';
  EDITOR_EMAILS.filter(Boolean).forEach(mail=>{
    try{ GmailApp.sendEmail(mail, subject, body); }catch(err){}
  });
}

// Helpers
function _json(obj, status){
  const out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}