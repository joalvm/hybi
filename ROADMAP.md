# Roadmap de Hybi

Estado del documento: auditoría del 4 de agosto de 2026, sobre `pre-release`
(`66b1c5a`, `v0.3.0-alpha.5`).

Este archivo tiene tres partes: dónde está el producto hoy, qué falta para
**beta** y qué falta para la **1.0**. Cada punto lleva casilla; marcada
significa hecho y verificado, no hecho a medias.

---

## 1. Dónde está hoy

**Métrica cruda.** 12 900 líneas en `src/`, 6 276 en `tests/`, 43 archivos de
prueba con 326 casos en verde, 8 pruebas E2E reales sobre la app empaquetada.
CI en Linux, Windows y macOS, más CodeQL, Dependency review y Dependabot.
Release automatizado por tag, con checksums SHA-256 y firma condicionada a que
existan los secretos.

**Veredicto de ingeniería: por encima de lo que la etiqueta *alpha* sugiere.**
La arquitectura de procesos, la política de seguridad, la persistencia de
documentos y el presupuesto de memoria del log están resueltos a nivel de
producto maduro. El riesgo del proyecto **no es técnico**; es de alcance,
distribución y mercado. Eso es lo que ordena las dos listas de abajo.

### Ya construido y funcionando

- [x] **Dos procesos con frontera real.** `contextIsolation`, `sandbox`, CSP
      estricta, `setWindowOpenHandler` en `deny` y fusibles de Electron
      activados. El preload expone una única superficie tipada.
- [x] **WebSocket completo, no de juguete.** Headers en el handshake,
      subprotocolos, reintento con backoff, keepalive ping/pong, verificación de
      certificado desactivable y tope de bytes por mensaje. Por conexión, no
      global.
- [x] **Catálogo con colecciones.** CRUD completo, árbol con navegación por
      teclado, búsqueda y menús contextuales.
- [x] **AsyncAPI 2.x y 3.x, en los dos sentidos.** Importa y exporta. Genera
      ejemplos desde el esquema.
- [x] **Entornos y variables.** `{{variable}}` en URL y payload, con popover de
      edición en línea, autocompletado y hover en Monaco. Los secretos se vacían
      antes de escribir a disco.
- [x] **Log de actividad a prueba de floods.** Lotes de 16 ms desde el main,
      lista virtualizada, presupuesto doble de 2 000 registros u 8 MB.
- [x] **Workspaces múltiples** con escritura atómica (temporal + rename) y un
      único formato en disco, el v1.
- [x] **Ventana de bienvenida separada**, chrome propio sin marco y menú nativo
      accesible desde el botón.
- [x] **Distribución multiplataforma**: NSIS, ZIP, DMG, AppImage, DEB y RPM.

### Deuda detectada en la auditoría

- [ ] **Tres archivos rompen la regla de 150 líneas del propio repo**:
      `useCatalogActions.ts` (215), `asyncapi/importer.ts` (180),
      `CatalogPanel.tsx` (155). La regla o se cumple o se cambia; hoy está en
      tierra de nadie.
- [ ] **`ThemeToggle` está marcado `data-temporary="true"` y en producción.** Un
      control de QA no debe viajar en un instalador.
- [ ] **Un workspace corrupto desaparece en silencio.** `summarize()` devuelve
      `null` y el archivo deja de aparecer sin decir nada. El usuario cree que
      perdió el trabajo.
- [ ] **Índice de Codebase Memory duplicado otra vez.** Existen
      `websocket-workbench` (1 607 nodos) y
      `C-Users-joalv-Documents-invian-websocket-workbench` (1 781 nodos). El
      segundo es el que CLAUDE.md manda borrar.
- [ ] **No hay `CHANGELOG.md`.** Las notas se generan de los PR; sirve para la
      alpha, no para una 1.0.

---

## 2. Análisis de producto

### Viabilidad

El mercado existe y es real, pero es **angosto y ya está ocupado**. Postman e
Insomnia soportan WebSocket y Socket.IO; Apidog, Firecamp y Hoppscotch también.
Por debajo, los clientes web gratuitos (websocketking, PieHost) cubren el caso
trivial en diez segundos y sin instalar nada.

Entrar ahí sólo funciona por diferenciación, y Hybi tiene cuatro que son
defendibles:

1. **AsyncAPI como ciudadano de primera.** Importa **y** exporta. Postman no
   importa AsyncAPI. Este es el foso real del producto y hoy está infravalorado
   en la comunicación: el README lo menciona como una función más.
2. **Headers en el handshake.** Ningún cliente basado en navegador puede
   hacerlo. Para cualquiera que autentique el `Upgrade` con un `Authorization`,
   Hybi resuelve un problema que la competencia web no puede tocar.
3. **Local, sin cuenta, sin nube.** Postman empuja login y sincronización. Hay
   equipos —banca, salud, sector público— a los que eso les cierra la puerta.
   Esto se vende solo, pero hay que decirlo en la primera pantalla del sitio.
4. **Aguante bajo carga.** Log virtualizado con presupuesto de memoria. Un
   cliente web se ahoga con un feed de mercado; este no.

### Riesgos, por orden de daño

1. **Binarios sin firmar.** Es el mayor asesino de conversión de todo el
   proyecto. Quien descarga y ve SmartScreen o Gatekeeper cierra la ventana. No
   importa lo buena que sea la app detrás. Certificado Windows: ~200–400 USD/año
   (OV) o EV con token. Apple Developer: 99 USD/año.
2. **Sólo WebSocket puro.** En la práctica, buena parte del tráfico que la gente
   llama «WebSocket» es Socket.IO. Un usuario que apunta Hybi a su app Socket.IO
   ve el handshake de *engine.io* como ruido, concluye que la herramienta está
   rota y no vuelve. Este fallo es peor que no soportarlo: **parece un bug**.
3. **Interfaz sólo en español.** El público objetivo lee inglés por defecto. Sin
   inglés, el techo de adopción es el mundo hispanohablante, y aun ahí muchos
   devs prefieren herramientas en inglés por costumbre. Es la diferencia entre
   decenas y miles de usuarios.
4. **GPL-3.0.** Correcta si el objetivo es software libre; costosa si en algún
   momento se quiere una edición pro cerrada. Sin CLA de los futuros
   contribuidores esa puerta se cierra para siempre. Decidirlo **ahora**, no en
   la 1.0.
5. **Sin modelo de ingresos natural.** Sin cuentas ni nube no hay suscripción.
   Las opciones realistas son patrocinio/donación, o una capa de equipo
   (sincronización, catálogos compartidos) que contradice el alcance actual.
   No es urgente, pero conviene no descubrirlo en la 1.0.

### Recepción esperable

- **Hoy, tal cual:** buena entre quien ya sufre AsyncAPI y WebSockets —un nicho
  pequeño y agradecido—. Indiferencia del resto.
- **Con inglés + Socket.IO + binarios + firma:** es un lanzamiento defendible en
  Hacker News y r/webdev. El titular que funciona no es «otro cliente
  WebSocket», es *«cliente de WebSocket que importa tu AsyncAPI y no te pide
  cuenta»*.
- **Lo que hundiría el lanzamiento:** salir sin firma, con el instalador
  gritando «origen desconocido», y sin Socket.IO. El primer comentario del hilo
  sería exactamente eso.

### Recomendación de alcance

**No añadir transportes hasta cerrar la beta.** El orden que maximiza retorno
por esfuerzo es: binarios → exportar el log → inglés → firma → Socket.IO. Todo
lo demás puede esperar a después de la 1.0.

---

## 3. Camino a BETA (`0.4.0-beta.1`)

Criterio de salida: **un cliente WebSocket que no deja al usuario a medias en
ningún flujo que la app ya promete**, con el formato de datos congelado.

### Funcionalidad que falta para no quedar a medias

- [ ] **Ver frames binarios.** Hoy sólo se lista `<binario N bytes>`. Falta
      visor hexadecimal con columna ASCII en el detalle. Un cliente que no
      enseña binario es medio cliente.
- [ ] **Enviar frames binarios.** `WebSocketTransportMessage` sólo lleva
      `text`. Falta el modo binario en el composer (hex, base64 o archivo).
- [ ] **Copiar un frame.** Ni el cuerpo ni la fila se pueden copiar. Con el
      log siendo el producto, no poder sacar nada de él es contradictorio.
- [ ] **Exportar la sesión.** Volcar el log a JSON o texto. Es el paso natural
      después de «inspeccionar»: pegarlo en un ticket o en un chat.
- [ ] **Filtrar el log por tipo.** Sólo hay búsqueda de texto. Faltan
      entrante / saliente / estado / error, que es como se lee un log real.
- [ ] **Reenviar un frame recibido.** Un clic desde una fila entrante al
      composer. Es el atajo que la gente busca a los diez minutos de uso.
- [ ] **Persistir el tema** y retirar el `ThemeToggle` temporal a su sitio
      definitivo.
- [ ] **Contador de mensajes y bytes por conexión** en la pestaña o la barra.
      Barato de hacer y es la primera pregunta de cualquiera que depura.

### Robustez

- [ ] **Avisar de un workspace ilegible** en vez de esconderlo. Una fila
      marcada como dañada, con la ruta del archivo y la opción de descartarla.
- [ ] **Log de la aplicación en disco** (rotado, en `userData`). Sin él, un
      fallo reportado por un usuario no es diagnosticable.
- [ ] **Errores de conexión legibles.** Revisar que `ECONNREFUSED`,
      `ENOTFOUND`, `CERT_HAS_EXPIRED` y el 401 del handshake lleguen como una
      frase útil y no como el mensaje crudo de `ws`.
- [ ] **Prueba de carga.** Medir con 10 000 msg/s sostenidos: memoria estable,
      interfaz sin bloquear, presupuesto del log respetado. Dejar el número
      escrito.
- [ ] **Migración de documentos a partir de la beta.** El formato volvió a v1
      durante la alpha porque no había nada instalado que conservar; la cadena
      v1→v4 se borró en lugar de arrastrarla. La primera versión que salga con
      usuarios reales congela ese contrato: desde ahí, cada cambio de formato
      necesita su paso de migración y una copia del archivo original antes de
      tocarlo.

### Higiene de repositorio

- [ ] **Cerrar la deuda de la sección 1** (tamaño de archivos, control
      temporal, índice duplicado).
- [ ] **`CHANGELOG.md`** siguiendo Keep a Changelog, alimentado por los títulos
      de los PR que ya son Conventional Commits.
- [ ] **Cobertura medida y con umbral en CI.** Hoy hay 326 pruebas, pero ningún
      número que impida que la cobertura baje.
- [ ] **Revisión de accesibilidad de teclado.** El árbol del catálogo ya la
      tiene; falta verificar diálogos, popovers y el recorrido de foco completo.

---

## 4. Camino a la 1.0 (primera release oficial)

Criterio de salida: **alguien que nunca oyó hablar de Hybi lo instala sin
fricción, lo entiende sin preguntar y no encuentra un muro en su caso de uso
habitual.**

### Distribución (bloqueante — nada de esto es opcional)

- [ ] **Firma de código en Windows.** Certificado OV o EV. Sin esto, SmartScreen
      espanta a la mayoría antes de la primera pantalla. La infraestructura del
      workflow ya está lista y condicionada a los secretos: sólo falta comprar
      el certificado.
- [ ] **Firma y notarización en macOS.** Cuenta de Apple Developer. Igual que
      arriba: el workflow ya contempla `stapler` y `spctl`.
- [ ] **Actualización automática o, como mínimo, aviso de versión nueva.** Una
      app de escritorio que no se entera de sus propias versiones envejece en la
      máquina del usuario. `electron-updater` sobre los releases de GitHub.
- [ ] **Canal beta separado del estable**, para que probar no obligue a arriesgar.

### Alcance de producto

- [ ] **Interfaz en inglés, con español como segundo idioma.** Hoy todo el texto
      está escrito directamente en los componentes. Requiere una capa de
      traducción antes de que el volumen de cadenas haga la migración cara. Es
      lo más caro de posponer de toda la lista.
- [ ] **Socket.IO.** El transporte más pedido después de WebSocket puro, y el
      que hoy hace *parecer* que la herramienta falla. La arquitectura ya está
      preparada: `TransportKind` es discriminado y el contrato está abstraído.
- [ ] **Preferencias de aplicación.** Tema, tamaño de fuente del editor, límites
      del log, comportamiento al arrancar. Hoy son constantes en el código.
- [ ] **Importar y exportar el workspace completo**, no sólo AsyncAPI. Es como
      se comparte una configuración con un compañero y como se hace copia de
      seguridad.
- [ ] **Autenticación asistida.** Un campo de token que rellene el header o el
      parámetro, en vez de escribir `Authorization: Bearer {{token}}` a mano.
      Pequeño, y es lo primero que hace todo el mundo.
- [ ] **Envío repetido o programado.** Mandar cada N segundos, o una secuencia.
      Es la prueba de carga del pobre y se pide constantemente.

### Presentación

- [ ] **Documentación de usuario de verdad** (sitio o wiki), separada del README
      técnico: primeros pasos, importar AsyncAPI, variables y entornos,
      resolución de problemas.
- [ ] **Landing page con capturas y un GIF de 20 segundos.** Nadie instala un
      binario sin firmar de una app que no ha visto funcionando.
- [ ] **Mensaje de posicionamiento en una frase.** Recomendado: *cliente de
      WebSocket que lee tu AsyncAPI y no te pide cuenta.* Debe ser el primer
      texto del sitio, del README y de la ficha del repositorio.
- [ ] **Auditoría de accesibilidad**: contraste en ambos temas, lector de
      pantalla en los paneles principales, foco visible en todo control.
- [ ] **Plantillas de issue afinadas con lo aprendido en la beta** y una
      etiqueta de «fallo con log adjunto» que apunte al log en disco.

### Confianza

- [ ] **Reporte de fallos opcional y explícito.** O telemetría anónima con
      consentimiento, o un botón de «reportar» que empaquete el log local y lo
      deje al usuario para que lo adjunte. Sin uno de los dos, los fallos de
      campo son invisibles.
- [ ] **Decisión de licencia tomada por escrito.** Si en algún momento habrá
      edición pro o relicencia, hace falta CLA **antes** del primer
      contribuidor externo. Después es irreversible.
- [ ] **Política de versiones publicada**: qué rompe compatibilidad, cada cuánto
      se publica, cuánto se soporta una versión.
- [ ] **Verificación reproducible de artefactos** documentada de forma que un
      usuario normal pueda seguirla, no sólo alguien que sepa usar `sha256sum`.

---

## 5. Después de la 1.0 (no bloquea nada)

- [ ] MQTT, STOMP, SSE y gRPC-Web como transportes adicionales.
- [ ] Validar los payloads contra el esquema de AsyncAPI, marcando los que no
      cumplen sin impedir enviarlos.
- [ ] Scripts previos al envío (firmar, sellar tiempo, calcular un campo).
- [ ] Comparar dos frames lado a lado.
- [ ] Catálogos compartidos por equipo — implica sincronización y contradice el
      alcance actual: es una decisión de producto, no una tarea.
- [ ] Modo servidor: levantar un eco local para probar sin backend.
- [ ] Interfaz de línea de comandos para integrar en CI.

---

## 6. Resumen para decidir

| Frente | Estado | Riesgo |
| --- | --- | --- |
| Ingeniería y seguridad | Sólido, por encima de la etiqueta alpha | Bajo |
| Alcance funcional | Falta binario, exportar log y Socket.IO | **Alto** |
| Distribución | Sin firmar: la mayor pérdida de usuarios | **Crítico** |
| Alcance de mercado | Sólo español | **Alto** |
| Diferenciación | AsyncAPI + headers + local: real y defendible | Bajo |
| Monetización | Sin modelo | Medio, aplazable |

**Los tres siguientes movimientos, en orden:** frames binarios (cierra el hueco
funcional más visible), exportar el log (cierra la promesa de *Inspect*) y la
capa de idioma con inglés (cuanto más tarde, más cara).
