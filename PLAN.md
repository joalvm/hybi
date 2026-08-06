# Plan de implementación — camino a `0.4.0-beta.1`

[ROADMAP.md](ROADMAP.md) dice **qué** falta. Este archivo dice **en qué orden se
hace y por qué en ese orden**. Cada punto de aquí es la cabecera de un plan
específico que se redacta cuando le toca el turno, no antes.

**Criterio de orden**: de lo más barato y prioritario a lo más caro. Dentro del
mismo coste, primero lo que abarata el trabajo posterior.

**Alcance de esta beta**: incluye Socket.IO, idiomas y preferencias de
aplicación. Es una beta más grande que la que planteaba el roadmap —que los
dejaba para la 1.0— y por tanto llega más tarde. La decisión se sostiene si la
beta es el momento del lanzamiento público: salir sin Socket.IO significa que
quien apunte Hybi a su servidor Socket.IO verá el handshake de *engine.io* como
ruido y concluirá que la herramienta está rota. Ese estreno no se repite.

**Estimaciones**: para una persona a tiempo completo, incluyendo pruebas y
revisión. `S` = 0,5–1 día. `M` = 2–4 días. `L` = 5–10 días. Total aproximado:
**44 días de trabajo efectivo**, unas nueve semanas.

---

## Orden de ejecución

| # | Punto | Coste | Fase | Estado |
| --- | --- | --- | --- | --- |
| 1 | Contador de mensajes y bytes por conexión | S | Cosecha rápida | hecho |
| 2 | Filtro del log por tipo | S | Cosecha rápida | hecho |
| 3 | Copiar un frame | S | Cosecha rápida | hecho |
| 4 | Reenviar un frame recibido | S | Cosecha rápida | hecho |
| 5 | Exportar la sesión a un archivo | M | Cosecha rápida | hecho |
| 6 | Preferencias de aplicación | M | Cimientos | hecho |
| 7 | Capa de idiomas (español + inglés) | M–L | Cimientos | hecho |
| 8 | Integridad del workspace | M | Datos | hecho |
| 9 | Diagnóstico: errores legibles y log en disco | M | Datos | pendiente |
| 10 | Frames binarios: ver y enviar | L | Protocolo | pendiente |
| 11 | Socket.IO | L | Protocolo | pendiente |
| 12 | `CHANGELOG.md` | S | Higiene | pendiente |
| 13 | Deuda del repositorio | S | Higiene | pendiente |
| 14 | Umbral de cobertura, carga y accesibilidad | M | Higiene | pendiente |

---

## Fase 0 — Cosecha rápida

Cinco puntos que no tocan ningún contrato compartido: todo vive en
`src/renderer/features/activity/` y en el store. Son los que más cambian la
sensación de uso por hora invertida, y se pueden hacer en cualquier orden entre
ellos.

### 1. Contador de mensajes y bytes por conexión — `S`

- **Qué**: cuántos mensajes han entrado y salido, y cuánto pesan, visible en la
  pestaña o en la barra de conexión.
- **Por qué ahora**: el dato ya existe. `ActivityRecord` lleva `bytes` y
  `sequence`; es estado derivado, no información nueva.
- **Toca**: `src/renderer/store/selectors.ts`, la barra de conexión.
- **Hecho cuando**: el contador sobrevive a un flood sin recalcular la lista
  entera en cada lote.

### 2. Filtro del log por tipo — `S`

- **Qué**: alternar entrante / saliente / estado / error, además de la búsqueda
  de texto que ya existe.
- **Por qué ahora**: `useActivityFilter.ts` ya es el punto de paso de todo el
  filtrado; se le añade un predicado.
- **Toca**: `useActivityFilter.ts`, `ActivityToolbar.tsx`.
- **Hecho cuando**: el filtro se combina con la búsqueda sin romper el
  virtualizado ni el auto-seguimiento.

### 3. Copiar un frame — `S`

- **Qué**: copiar el cuerpo o la fila desde el menú contextual y con teclado.
- **Por qué ahora**: `src/main/ipc/clipboard.handlers.ts` ya existe; es
  cablearlo a la fila.
- **Toca**: `ActivityRow.tsx`, `ActivityDetail.tsx`.
- **Hecho cuando**: copia el cuerpo exacto que cruzó el socket, no la vista
  previa truncada de la fila.

### 4. Reenviar un frame recibido — `S`

- **Qué**: un clic desde una fila entrante carga su cuerpo en el composer.
- **Por qué ahora**: es el atajo que la gente busca a los diez minutos de uso, y
  el camino store → composer ya está trazado por el catálogo.
- **Toca**: `ActivityRow.tsx`, `useComposerDraft.ts`.
- **Hecho cuando**: el borrador actual no se pierde sin avisar.

### 5. Exportar la sesión a un archivo — `M`

- **Qué**: volcar el log a JSON o texto plano.
- **Por qué ahora**: cierra la promesa de *Inspect*; hoy lo que se ve no sale de
  la aplicación. Estrena el diálogo de guardar archivo en el main, que el punto
  6 reutiliza.
- **Toca**: canal nuevo en `src/main/ipc/`, `src/preload/index.ts`,
  `ActivityToolbar.tsx`.
- **Cuidado**: los secretos resueltos no deben viajar al archivo exportado. Se
  aplica el mismo criterio que `redact.ts` usa al escribir el workspace.
- **Hecho cuando**: exportar 2 000 registros no bloquea la interfaz y el archivo
  se puede volver a leer.

---

## Fase 1 — Cimientos

Los dos puntos cuyo precio sube cada semana que pasan. Van juntos y en este
orden: el selector de idioma necesita un sitio donde vivir.

### 6. Preferencias de aplicación — `M`

- **Qué**: tema, tamaño de fuente del editor, límites del log, comportamiento al
  arrancar, idioma. Persistidas en `userData`, aparte del workspace.
- **Por qué ahora**: hoy son constantes en el código, y cada punto posterior
  añade otra. Además absorbe dos pendientes del roadmap: persistir el tema y
  retirar el `ThemeToggle` marcado `data-temporary="true"`, que no debe viajar
  en un instalador.
- **Toca**: archivo nuevo en `src/main/workspace/` con la misma escritura
  atómica (temporal + rename), slice nuevo en `src/renderer/store/`, diálogo
  siguiendo el patrón de `features/connections/settings/`.
- **Depende de**: 5 (reutiliza el trabajo de archivo en el main).
- **Hecho cuando**: un archivo de preferencias corrupto arranca con los valores
  por omisión en vez de impedir el arranque.

### 7. Capa de idiomas: español + inglés — `M–L`

- **Qué**: extraer el texto de los componentes a catálogos por idioma, con
  inglés como idioma por omisión y español completo.
- **Por qué ahora**: es lo más caro de posponer de toda la lista. 82 archivos de
  interfaz con el texto escrito directamente dentro; el volumen crece con cada
  función que se añade. Hacerlo antes de los puntos 10 y 11 significa que esas
  funciones nacen traducidas en vez de exigir una segunda pasada.
- **Toca**: todo `src/renderer/`, más los textos del menú nativo y de los
  diálogos del sistema en `src/main/`.
- **Depende de**: 6 (el selector de idioma vive en preferencias).
- **Decisiones que resuelve su plan específico**: biblioteca o capa propia,
  formato del catálogo, plurales y fechas, y qué pasa con los mensajes de error
  que hoy nacen en el proceso main.
- **Hecho cuando**: no queda ningún texto de interfaz fuera del catálogo —
  verificado con una regla de ESLint, no a ojo— y cambiar de idioma no exige
  reiniciar.

---

## Fase 2 — Datos

Una beta le dice al usuario que puede confiarle trabajo. Estos dos puntos son lo
que respalda esa frase.

### 8. Integridad del workspace — `M`

- **Qué**: dos cosas que van juntas. Avisar de un workspace ilegible en vez de
  esconderlo, y reponer la migración de documentos —borrada durante la alpha
  junto con la cadena v1→v4— con copia del archivo original antes de tocarlo.
- **Por qué ahora**: `summarize()` en `src/main/workspace/repository.ts`
  devuelve `null` ante un archivo dañado y la fila desaparece de la lista. El
  usuario concluye que perdió el trabajo. Es el peor fallo que puede tener el
  producto y hoy es silencioso. Y a partir de la beta ya hay instalaciones
  reales: el formato v1 queda congelado y cualquier cambio posterior necesita
  su paso de migración.
- **Toca**: `repository.ts`, un módulo de migración nuevo en
  `src/shared/domain/`, la lista de la ventana de bienvenida.
- **Hecho cuando**: un archivo dañado a mano aparece como fila marcada, con la
  ruta y la opción de descartarla, y una migración interrumpida puede volver
  atrás.

### 9. Diagnóstico: errores legibles y log en disco — `M`

- **Qué**: que `ECONNREFUSED`, `ENOTFOUND`, `CERT_HAS_EXPIRED` y el 401 del
  handshake lleguen como una frase útil. Y un log de la aplicación rotado en
  `userData`.
- **Por qué ahora**: sin log en disco, un fallo reportado durante la beta no es
  diagnosticable, y la beta existe precisamente para recibir reportes.
- **Toca**: `src/main/connections/websocket/attempt.ts` y `reporter.ts`, módulo
  nuevo de log en `src/main/`.
- **Cuidado**: el log no escribe cabeceras, tokens ni cuerpos de mensaje. Ruta,
  código de error y estado; nada más.
- **Hecho cuando**: existe un botón que abre la carpeta del log y el archivo se
  puede adjuntar a un issue sin revisarlo primero.

---

## Fase 3 — Protocolo

Lo caro. Aquí se ensancha lo que la aplicación entiende.

### 10. Frames binarios: ver y enviar — `L`

- **Qué**: visor hexadecimal con columna ASCII en el detalle, y modo binario en
  el composer (hex, base64 o archivo).
- **Por qué antes que Socket.IO**: es más barato y deja el terreno listo. Hoy
  `bodyOf()` en `websocket/frame.ts` colapsa cualquier binario a
  `<binario N bytes>` y `WebSocketTransportMessage` sólo lleva `text`. Si
  Socket.IO llega antes, hereda el mismo agujero, porque sus adjuntos también
  son binarios.
- **Toca**: `src/shared/transport/websocket.ts` (el mensaje deja de ser sólo
  texto), `frame.ts`, `ActivityDetail.tsx`, el composer, y el presupuesto de
  memoria del log —que hoy cuenta caracteres y pasará a contar bytes.
- **Hecho cuando**: un binario de 1 MB se puede mirar sin que la lista pierda
  fluidez, y lo que se envía llega byte a byte idéntico.

### 11. Socket.IO — `L`

- **Qué**: transporte nuevo, con su configuración, su modelo de eventos con
  nombre y argumentos, y sus confirmaciones (*ack*).
- **Por qué al final**: es el punto que más superficie toca, y el único que se
  beneficia de que los diez anteriores ya estén cerrados.
- **La arquitectura ya lo espera**: `TransportFactoryMap<T>` en
  `domain/connections/connection.ts` es un mapa total que el compilador rechaza
  hasta que cubre todos los transportes, y `ADAPTER_FACTORIES` en
  `main/connections/transport.ts` es el único punto de registro. El compilador
  va a ir señalando cada sitio que falta: eso es diseño, no accidente.
- **Toca**: nueva rama de la unión `ConnectionTransport` y su esquema, el paso
  de migración que corresponda al formato vigente, adaptador nuevo bajo
  `src/main/connections/socketio/`, `ActivityRecord`
  —que hoy es un alias de una sola variante y pasa a ser unión—, panel de
  configuración y composer con nombre de evento.
- **Depende de**: 7 (nace traducido) y 10 (adjuntos binarios).
- **Hecho cuando**: conecta contra un servidor Socket.IO real —no un simulacro—
  con namespace, reconexión y ack, y las pruebas E2E lo cubren igual que a
  WebSocket.

---

## Fase 4 — Higiene de release

No aporta funciones. Es lo que separa publicar una beta de publicar un binario.

### 12. `CHANGELOG.md` — `S`

Formato Keep a Changelog, alimentado por los títulos de los PR, que ya son
Conventional Commits. Se puede empezar en cualquier momento; cuanto antes,
menos historia hay que reconstruir.

### 13. Deuda del repositorio — `S`

Los tres archivos que rompen la regla de 150 líneas del propio repo
—`useCatalogActions.ts` (221), `asyncapi/importer.ts` (186),
`CatalogPanel.tsx` (157)—: o se parten o se cambia la regla, pero no se quedan
donde están.

### 14. Umbral de cobertura, carga y accesibilidad — `M`

- Cobertura medida con umbral en CI: hay 371 pruebas y ningún número que impida
  que bajen.
- Prueba de carga con 10 000 msg/s sostenidos, con el resultado escrito:
  memoria estable, interfaz sin bloquear, presupuesto del log respetado.
- Repaso de accesibilidad de teclado en diálogos, popovers y recorrido de foco.
  El árbol del catálogo ya está; falta el resto.

---

## Lo que no está en este plan

Tres cosas que bloquean la **1.0** y que no se resuelven programando:

- **Firma de código en Windows y macOS.** El workflow de release ya está
  preparado y condicionado a que existan los secretos. Falta comprar los
  certificados: ~200–400 USD/año en Windows, 99 USD/año en Apple. Es la mayor
  pérdida de usuarios del proyecto y no depende de ninguna línea de código.
- **Landing con capturas y documentación de usuario.** Nadie instala un binario
  sin firmar de una aplicación que no ha visto funcionando.
- **Decisión de licencia.** Si alguna vez habrá edición cerrada o relicencia,
  hace falta CLA antes del primer contribuidor externo. Después es
  irreversible.

## Regla de ejecución

Un punto, una rama, un plan específico escrito al empezarlo. Prueba que falle
primero, `npm run verify` en verde, PR con título en Conventional Commits.
Al cerrar cada punto: commit y reindexado de Codebase Memory con
`name: "websocket-workbench"` explícito, verificando que las rutas nuevas
quedaron en el grafo.
