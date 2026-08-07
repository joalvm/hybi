# Changelog

Todos los cambios notables de Hybi se anotan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
versionado sigue [Versionado Semántico](https://semver.org/lang/es/).

Las entradas anteriores a la `0.4.0-beta.1` se reconstruyeron a partir de los
títulos de los PR fusionados, que ya son Conventional Commits. A partir de aquí
cada PR escribe su propia línea bajo `Unreleased` antes de fusionarse: un
changelog que se redacta al final es arqueología, no documentación.

## [Unreleased]

### Añadido

- Selector de transporte en la barra de la URL, con el logo del protocolo y su
  color propio. Cambiar de transporte deja de exigir abrir el diálogo de
  configuración, y confirma antes de descartar una URL o unos ajustes que ya
  estaban escritos.
- Logo del transporte en la pestaña de cada conexión, junto al punto de estado.
  El logo dice qué protocolo habla y el punto cómo está: dos canales para dos
  preguntas distintas.
- Total de registros en la franja de tráfico, junto a los mensajes y bytes de
  cada dirección.

### Cambiado

- El contador de tráfico se mudó de la barra de conexión a una franja al pie del
  panel de actividad, que es el panel del que informa.
- El límite de tamaño de archivo pasó de 150 a 225 líneas de código y dejó de
  ser prosa: lo comprueba `max-lines` en `eslint.config.js` sobre `src/`.

## [0.3.0-alpha.8] — 2026-08-06

### Añadido

- Frames binarios en los dos sentidos: visor hexadecimal con columna ASCII en el
  detalle y modo binario en el composer (hex, base64 o un archivo que se lee en
  el proceso principal y nunca entra en el editor).
- Socket.IO como transporte completo: namespace, `auth` del handshake,
  reconexión de la propia librería, eventos con nombre y ack.
- Diagnóstico de conexión: `ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`,
  `ECONNRESET`, los errores de ruta y la familia de certificado llegan como una
  frase que conserva el código.

## [0.3.0-alpha.7] — 2026-08-06

### Añadido

- Preferencias de aplicación persistidas aparte del workspace: tema, tamaño de
  fuente del editor, límites del log y comportamiento al arrancar.
- Capa de idiomas con inglés por omisión y español completo. El texto vive en
  `src/lang/{en,es}` y cambiar de idioma no exige reiniciar.

### Eliminado

- El `ThemeToggle` marcado `data-temporary`, que era un control de QA y no debía
  viajar en un instalador. El tema se cambia desde Preferencias.

## [0.3.0-alpha.6] — 2026-08-04

### Añadido

- Contador de mensajes y bytes por conexión, acumulado al aterrizar cada lote.
- Filtro del log por tipo, combinado con la búsqueda de texto.
- Copiar un frame desde la fila, el detalle o el teclado.
- Reenviar al composer un frame recibido, preguntando antes de pisar un borrador.
- Exportar la sesión a JSON o texto plano, con los secretos resueltos escritos
  otra vez como `{{variable}}` antes de tocar el disco.

### Cambiado

- El formato del workspace en disco vuelve al v1 como único formato publicado.

## [0.3.0-alpha.5] — 2026-08-03

### Cambiado

- El log de actividad trabaja contra un presupuesto de memoria acotado y la ruta
  caliente deja de repetir trabajo en cada lote.

## [0.3.0-alpha.4] — 2026-08-03

### Corregido

- La publicación de las notas del pre-release.

## [0.3.0-alpha.3] — 2026-08-03

### Corregido

- Los iconos de Windows y las notas de release.
- La sección de nuevos colaboradores de la nota de release, ahora traducida.

## [0.3.0-alpha.2] — 2026-08-03

### Añadido

- La nota de cada release se arma con descargas, checksums y cambios.

### Corregido

- Falta el correo del autor para poder empaquetar `deb` y `rpm`.

## [0.3.0-alpha.1] — 2026-08-03

Primera publicación pública. Cliente WebSocket de escritorio con catálogo
AsyncAPI, entornos y variables, log de actividad virtualizado y workspaces
múltiples.

### Añadido

- Documentación editable y exportación del workspace completo.
- Diálogo propio de «Acerca de» desde el menú Ayuda.
- Instaladores de la alpha publicados aunque no estén firmados: NSIS, ZIP, DMG,
  AppImage, DEB y RPM.

### Cambiado

- Base extensible de transportes, sobre la que después entró Socket.IO.
- El renderer migró a Tailwind 4 con PostCSS.

### Corregido

- Las pruebas en Linux y macOS dejan de ser inestables en CI.
- Argumentos sobrantes en las slices del store.

[Unreleased]: https://github.com/joalvm/hybi/compare/v0.3.0-alpha.8...HEAD
[0.3.0-alpha.8]: https://github.com/joalvm/hybi/compare/v0.3.0-alpha.7...v0.3.0-alpha.8
[0.3.0-alpha.7]: https://github.com/joalvm/hybi/compare/v0.3.0-alpha.6...v0.3.0-alpha.7
[0.3.0-alpha.6]: https://github.com/joalvm/hybi/compare/v0.3.0-alpha.5...v0.3.0-alpha.6
[0.3.0-alpha.5]: https://github.com/joalvm/hybi/compare/v0.3.0-alpha.4...v0.3.0-alpha.5
[0.3.0-alpha.4]: https://github.com/joalvm/hybi/compare/v0.3.0-alpha.3...v0.3.0-alpha.4
[0.3.0-alpha.3]: https://github.com/joalvm/hybi/compare/v0.3.0-alpha.2...v0.3.0-alpha.3
[0.3.0-alpha.2]: https://github.com/joalvm/hybi/compare/v0.3.0-alpha.1...v0.3.0-alpha.2
[0.3.0-alpha.1]: https://github.com/joalvm/hybi/releases/tag/v0.3.0-alpha.1
