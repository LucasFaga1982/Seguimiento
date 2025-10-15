# Seguimiento de Productos — Docentes Brown

App web lista para GitHub Pages que consume la **base publicada como CSV** y permite **editar la etapa** (con login) y notificar por mail. Ahora incluye **Número de seguimiento (columna AA)** visible en cada tarjeta, con botón **Copiar** para que el comprador lo tenga a mano.

---

## 🗂 Archivos

- `index.html` — App completa (UI responsive 2 columnas, búsqueda por nombre/etapa/seguimiento, WhatsApp, cambio de etapa, copia de seguimiento).
- `sw.js` — Service Worker mínimo para notificaciones en modo editor.
- `manifest.webmanifest` — PWA opcional (instalable en móvil).
- `Code.gs` — Backend (Apps Script) para **escritura** y **emails**.
- `README.md` — Este instructivo.

---

## 📥 Estructura de la hoja (columnas relevantes)

- **C**: Nombre  
- **D**: Celular (WhatsApp)  
- **F**: Contacto (email)  
- **X**: Etapa  
- **Y**: `UltimaActualizacion` (fecha/hora)  
- **AA**: `NumeroSeguimiento` (se muestra en las tarjetas con botón Copiar)

La app detecta por encabezado si cambió el índice de las columnas (busca “nombre”, “etapa”, “actualiz…”, “seguim…”).

---

## ✉️ Email automático al cambiar la etapa

Desde el Web App (Apps Script) se envía:
> “Buenas, queremos contarte que tu Agenda esta en la ETAPA <ETAPA>, en cuanto llegue a la etapa "entrega" nos estaremos comunicando en los siguientes días hábiles para coordinar.”

---

## 🔔 Alertas por pedidos estancados (+7 días)

- Notificaciones emergentes al abrir en **modo editor** si hay pedidos con más de 7 días sin cambios.  
- (Opcional) Disparador diario `notifyEditorsOfStale()` para email a `EDITOR_EMAILS`.

---

## 🚀 Pasos rápidos

1. Publicá tu CSV (ya lo tenés).  
2. Configurá y desplegá `Code.gs` como **Web App**.  
3. Pegá la URL del Web App en `index.html` → `APPS_SCRIPT_URL`.  
4. Subí todo a GitHub Pages.  
5. Login editor: **DOCENTESBROWN / NestorVive**.

¿Querés que también armemos enlaces directos de rastreo si el número coincide con Andreani/Correo Argentino/OCA? Lo puedo detectar por prefijos y armar el link automático.