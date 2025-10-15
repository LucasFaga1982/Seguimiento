// == Google Apps Script backend (ampliado con endpoint de lectura) ==
// Pasos: abrir la hoja > Extensiones > Apps Script > pegar este archivo > Deploy como Web App (acceso: cualquiera con el enlace).
// Pegá la URL de despliegue en APPS_SCRIPT_URL del index.html.

const SHEET_NAME = 'Hoja 1'; // Cambiá si tu pestaña se llama distinto
const COL = {
  NOMBRE: 3, TELEFONO: 4, CONTACTO: 6, ETAPA: 24, ULTIMA_ACT: 25, SEGUIMIENTO: 27
};
const AUTH = { user: 'DOCENTESBROWN', pass: 'NestorVive' };
const EDITOR_EMAILS = ['tu-editor@ejemplo.com'];

function _getSheet(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME);
  if(!sh) throw new Error('No existe la hoja: ' + SHEET_NAME);
  return sh;
}

function doGet(e){
  try{
    const action = (e && e.parameter && e.parameter.action) || 'ping';
    if(action === 'ping'){ return _json({ ok:true, pong:true }); }
    if(action === 'stale'){
      const days = parseInt(e.parameter.days||'7',10);
      const items = _findStale(days);
      return _json({ ok:true, items });
    }
    if(action === 'sheet'){
      const sh = _getSheet();
      const range = sh.getDataRange();
      const values = range.getValues(); // incluye encabezados
      return _json({ ok:true, rows: values });
    }
    return _json({ ok:false, error:'Acción no soportada' });
  }catch(err){
    return _json({ ok:false, error: String(err) });
  }
}

function doPost(e){
  try{
    const params = e && e.parameter ? e.parameter : {};
    if(params.action === 'updateStage'){
      if(params.user !== AUTH.user || params.pass !== AUTH.pass){
        return _json({ ok:false, error:'No autorizado' });
      }
      const rowNumber = parseInt(params.rowNumber,10);
      const newStage = String(params.newStage||'');
      const name = String(params.name||'');
      const email = String(params.email||'');
      if(!rowNumber || !newStage){ return _json({ ok:false, error:'Faltan parámetros' }); }

      const sh = _getSheet();
      sh.getRange(rowNumber, COL.ETAPA).setValue(newStage);
      sh.getRange(rowNumber, COL.ULTIMA_ACT).setValue(new Date());

      if(email){
        const subject = 'Actualización de Agenda';
        const body = 'Buenas, queremos contarte que tu Agenda esta en la ETAPA ' + newStage + ', en cuanto llegue a la etapa "entrega" nos estaremos comunicando en los siguientes días hábiles para coordinar.';
        GmailApp.sendEmail(email, subject, body);
      }
      return _json({ ok:true });
    }
    return _json({ ok:false, error:'Acción no soportada' });
  }catch(err){
    return _json({ ok:false, error: String(err) });
  }
}

function _findStale(minDays){
  const sh = _getSheet();
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if(lastRow < 2) return [];
  const values = sh.getRange(2, 1, lastRow-1, lastCol).getValues();
  const out = [];
  const today = new Date();
  for(let i=0;i<values.length;i++){
    const r = values[i];
    const name = r[COL.NOMBRE-1];
    const etapa = r[COL.ETAPA-1];
    const last = r[COL.ULTIMA_ACT-1];
    if(last && last instanceof Date){
      const diff = Math.floor((today - last) / (1000*60*60*24));
      if(diff >= minDays){ out.push({ index: i+2, name: name||'', stage: etapa||'', days: diff }); }
    }
  }
  return out;
}

function _json(obj){
  const out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}