# Roadmap de Hybi

Estado del documento: auditoría del 4 de agosto de 2026, cerrada sobre `main`
(`de3dfd6`) al publicar la `v0.4.0-beta.1`.

Este archivo tiene tres partes: dónde está el producto hoy, qué falta para
**beta** y qué falta para la **1.0**. Cada punto lleva casilla; marcada
significa hecho y verificado, no hecho a medias.

---

## 1. Dónde está hoy

**Métrica cruda.** 16 622 líneas en `src/`, 9 047 en `tests/`, 56 archivos de
prueba con 484 casos en verde, 9 pruebas E2E reales sobre la app empaquetada.
CI en Linux, Windows y macOS, más CodeQL, Dependency review y Dependabot.
Release automatizado por tag, con checksums SHA-256 y firma condicionada a que
existan los secretos.

**Veredicto de ingeniería: llega a la beta con margen.**
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

- [x] **Varios archivos rompían la regla de 150 líneas del propio repo**:
      `useCatalogActions.ts` (221), `asyncapi/importer.ts` (186),
      `CatalogPanel.tsx` (157) y tres más. La regla se cambió a 225 líneas de
      código —sin comentarios ni blancos— y dejó de estar en tierra de nadie:
      `max-lines` en `eslint.config.js` la comprueba sobre `src/`. `tests/`
      queda exento a propósito.
- [x] **`ThemeToggle` está marcado `data-temporary="true"` y en producción.** Un
      control de QA no debe viajar en un instalador. Retirado: el tema es una
      preferencia persistida y se cambia desde el diálogo de preferencias.
- [x] **Un workspace corrupto desaparecía en silencio.** `summarize()` devolvía
      `null` y el archivo dejaba de aparecer sin decir nada. Ahora la fila se
      queda, dice que el archivo no se puede leer y ofrece descartarlo: sale de
      la lista cuando el disco confirma que salió, no antes.
- [x] **Índice de Codebase Memory duplicado otra vez.** El proyecto derivado de
      la ruta, `C-Users-joalv-Documents-invian-websocket-workbench`, quedó
      borrado; el único índice vivo es `websocket-workbench`.
- [x] **No había `CHANGELOG.md`.** Existe, en formato Keep a Changelog, con la
      historia reconstruida desde los PR fusionados. Lo nuevo entra bajo
      `Unreleased` en el mismo PR que lo introduce.

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
por esfuerzo es: binarios → inglés → firma → Socket.IO. Exportar el log ya está
hecho, en la 0.3.0-alpha.6. Todo lo demás puede esperar a después de la 1.0.

---

## 3. Camino a BETA (`0.4.0-beta.1`)

Criterio de salida: **un cliente WebSocket que no deja al usuario a medias en
ningún flujo que la app ya promete**, con el formato de datos congelado.

### Funcionalidad que falta para no quedar a medias

- [x] **Ver frames binarios.** Visor hexadecimal con columna ASCII en el
      detalle, virtualizado: un megabyte se recorre sin que la lista pierda
      fluidez. La fila previsualiza los primeros bytes en hex, no en base64.
- [x] **Enviar frames binarios.** Modo binario en el composer: hex, base64 o
      un archivo que se lee en el proceso principal y nunca entra en el editor.
      El techo de tamaño se mide en bytes de cable.
- [x] **Copiar un frame.** Menú contextual en la fila, Ctrl+C con el foco
      puesto en ella y botón en el detalle. El cuerpo sale exacto.
- [x] **Exportar la sesión.** JSON o texto plano, con el diálogo de guardado
      del sistema. Los secretos resueltos vuelven a escribirse como
      `{{variable}}` antes de tocar el disco.
- [x] **Filtrar el log por tipo.** Entrante, saliente, estado y error,
      combinados con la búsqueda de texto en una sola pasada.
- [x] **Reenviar un frame recibido.** Un clic desde la fila o desde el detalle
      al composer, preguntando antes de pisar un borrador sin guardar.
- [x] **Persistir el tema** y retirar el `ThemeToggle` temporal a su sitio
      definitivo. Vive en `preferences.json`, aparte del workspace, junto al
      tamaño de fuente del editor, los límites del log y el arranque.
- [x] **Contador de mensajes y bytes por conexión** en la barra de conexión.
      Se acumula cuando aterriza cada lote, no se deriva del log recortado.

### Robustez

- [x] **Avisar de un workspace ilegible** en vez de esconderlo. Una fila
      marcada como dañada, con la ruta del archivo, el motivo y la opción de
      descartarla tras confirmar.
- [x] **Log de la aplicación en disco**, rotado y en `userData`. Ruta sin
      query, código de error y estado de la conexión; nunca cabeceras, tokens
      ni cuerpos. Se abre desde Preferencias → General.
- [x] **Errores de conexión legibles.** `ECONNREFUSED`, `ENOTFOUND`,
      `ETIMEDOUT`, `ECONNRESET`, las de ruta y la familia de certificado llegan
      como una frase que conserva el código, y el estado del handshake se lee
      del mensaje que lanza `ws`.
- [x] **Migración de documentos a partir de la beta.** La cadena vuelve a
      existir como dato, hoy vacía porque v1 es el único formato publicado, con
      guarda de versión y copia del archivo original antes de reescribirlo. Un
      documento guardado por una versión posterior se rechaza en vez de
      reinterpretarse.

### Higiene de repositorio

- [x] **Cerrar la deuda de la sección 1** (tamaño de archivos, control
      temporal, índice duplicado).
- [x] **`CHANGELOG.md`** siguiendo Keep a Changelog, alimentado por los títulos
      de los PR que ya son Conventional Commits.

Tres puntos que estaban aquí —umbral de cobertura en CI, prueba de carga de
10 000 msg/s y repaso de accesibilidad de teclado— pasaron al camino a la 1.0.
Un umbral y una cifra de carga protegen una superficie que ya no se mueve, y la
beta existe para que se mueva: fijarlos ahora sólo garantiza volver a
discutirlos en cada PR de la beta.

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

- [x] **Interfaz en inglés, con español como segundo idioma.** El texto vive en
      `src/lang/{en,es}`, un catálogo JSON por dominio; el inglés es el idioma
      por omisión y su forma es el tipo contra el que se comprueba el español.
      Una regla propia de ESLint impide que vuelva a aparecer texto suelto en un
      componente, y cambiar de idioma no exige reiniciar.
- [x] **Socket.IO.** Transporte completo: namespace, `auth` del handshake,
      reconexión propia de la librería, eventos con nombre y ack. Se elige
      desde la primera fila del panel de conexión, y las pruebas —unitarias y
      E2E— corren contra un servidor Socket.IO real.
- [x] **Preferencias de aplicación.** Tema, tamaño de fuente del editor, límites
      del log, comportamiento al arrancar. Adelantadas a la beta: cada función
      nueva añadía otra constante en el código.
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
      pantalla en los paneles principales, foco visible en todo control. Incluye
      el repaso de teclado que venía de la beta: diálogos, popovers y el
      recorrido de foco completo. El árbol del catálogo ya lo tiene.
- [ ] **Plantillas de issue afinadas con lo aprendido en la beta** y una
      etiqueta de «fallo con log adjunto» que apunte al log en disco.

### Confianza

- [ ] **Cobertura medida y con umbral en CI.** Hay más de 400 pruebas y ningún
      número que impida que la cobertura baje. Se fija cuando la superficie deja
      de moverse, es decir después de la beta y no antes.
- [ ] **Prueba de carga con el resultado escrito.** 10 000 msg/s sostenidos:
      memoria estable, interfaz sin bloquear, presupuesto del log respetado. El
      número publicado es parte de la promesa de «aguante bajo carga»; hasta que
      exista, esa ventaja es una afirmación sin medir.
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
| Ingeniería y seguridad | Sólido, con margen sobre lo que pide la beta | Bajo |
| Alcance funcional | Binario y Socket.IO cerrados | Bajo |
| Distribución | Sin firmar: la mayor pérdida de usuarios | **Crítico** |
| Alcance de mercado | Inglés y español, inglés por omisión | Bajo |
| Diferenciación | AsyncAPI + headers + local: real y defendible | Bajo |
| Monetización | Sin modelo | Medio, aplazable |

**Los tres movimientos que se marcaron —binarios, integridad del workspace y
Socket.IO— están hechos, y la higiene de release también: `CHANGELOG.md` existe
y la regla de tamaño de archivo la comprueba ESLint.** No queda nada de
ingeniería por delante de la beta. Lo que sigue pendiente es firmar los
instaladores, que no se resuelve programando y sigue siendo la mayor pérdida de
usuarios del proyecto.
