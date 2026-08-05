<p align="center">
  <img src="resources/images/icon.png" alt="Hybi" width="112" height="112">
</p>

<h1 align="center">Hybi</h1>

<p align="center"><strong>Connect. Inspect. Replay.</strong></p>

<p align="center">
  Una aplicación de escritorio para trabajar con conexiones en tiempo real.
</p>

> [!IMPORTANT]
> **Hybi está en fase alpha.** Ya se puede usar y hace lo que promete, pero
> sigue en construcción: faltan funciones, algunas cosas cambiarán de sitio y
> pueden aparecer fallos. Pruébalo y cuenta lo que encuentres.

---

## Qué es Hybi

Casi todo lo que usamos a diario habla por internet de dos formas distintas.

La primera es una conversación corta: preguntas algo, te responden y la línea se
cuelga. Así funciona abrir una página o buscar un producto.

La segunda es una **llamada que se queda abierta**. Nadie cuelga, y los mensajes
van y vienen mientras dure. Así funcionan el chat que te avisa al instante, el
marcador que cambia solo, la ubicación del repartidor moviéndose por el mapa o
la pantalla de precios que parpadea sola. A esa línea abierta se le llama
WebSocket.

Para el primer tipo de conversación existen herramientas muy conocidas. Para el
segundo, casi siempre toca improvisar. **Hybi es la herramienta que faltaba para
ese segundo caso**: abre la línea, la mantiene, te enseña todo lo que pasa por
ella y te deja intervenir en la conversación.

## Para quién es

Para quien construye o prueba estas conexiones: desarrollo, control de calidad,
soporte técnico. Y para cualquiera que necesite ver, con sus propios ojos, qué
está viajando por una línea que normalmente es invisible.

## Qué puedes hacer

- **Abrir la línea.** Escribes la dirección del servidor y te conectas. Puedes
  cortar y volver a conectar cuando quieras.
- **Ver la conversación completa.** Todo lo que entra y sale queda en pantalla,
  en orden y en el momento en que ocurre. Puedes detenerte en cualquier mensaje y
  leerlo con calma.
- **Enviar mensajes.** Escribes lo que quieras mandar y lo envías. Ni más ni
  menos: llega exactamente lo que escribiste.
- **Guardar los mensajes que repites.** Los que usas siempre se quedan en un
  catálogo, organizados, listos para reenviar sin volver a escribirlos.
- **Cargar un catálogo de golpe.** Si el equipo que hizo el servidor documentó
  sus mensajes en el formato estándar del sector (AsyncAPI), Hybi lee ese
  documento y llena el catálogo solo, con ejemplos incluidos.
- **Cambiar de entorno sin reescribir nada.** Guardas los datos que cambian entre
  pruebas y producción —direcciones, claves, identificadores— y cambias de uno a
  otro con un clic. Los datos sensibles se muestran ocultos y no se guardan en el
  disco: viven solo mientras la aplicación está abierta.
- **Separar tus proyectos.** Cada proyecto vive en su propio espacio de trabajo,
  con sus conexiones y su catálogo.

## Cómo se usa, en cuatro pasos

1. Abres Hybi y eliges (o creas) un espacio de trabajo.
2. Escribes la dirección del servidor y pulsas **Conectar**.
3. Miras la conversación en vivo y envías los mensajes que necesites.
4. Guardas lo que vas a repetir y cierras. La próxima vez está todo donde lo
   dejaste.

## Tus datos se quedan contigo

Hybi no pide cuenta, no sube nada a ningún servicio y no lleva estadísticas de
uso. Todo lo que guardas queda en un archivo dentro de tu propio equipo, y la
conexión sale directamente de tu máquina hacia el servidor que tú indiques: eso
incluye servidores que solo existen en tu ordenador, sin ningún intermediario.

Las claves y contraseñas que marques como secretas nunca se escriben en el disco.

## Instalación

Descarga la última versión desde la
[página de releases](https://github.com/joalvm/hybi/releases). Mientras dure la
alpha se marcan como versiones de prueba (*pre-release*).

| Sistema | Archivo |
| --- | --- |
| Windows 10/11 (64 bits) | `Hybi-<versión>-win-x64.exe`, o el `.zip` si prefieres no instalar nada |
| macOS (Intel y Apple Silicon) | `Hybi-<versión>-mac-universal.dmg` |
| Linux (cualquier distro) | `Hybi-<versión>-linux-x64.AppImage` |
| Debian / Ubuntu | `Hybi-<versión>-linux-x64.deb` |
| Fedora / RHEL / openSUSE | `Hybi-<versión>-linux-x64.rpm` |

### El sistema avisará de que no está firmado

Hybi todavía no tiene certificados de firma de código, así que Windows y macOS
avisarán de que el programa viene de un origen desconocido:

- **Windows**: en la pantalla de SmartScreen, pulsa **Más información** y luego
  **Ejecutar de todas formas**.
- **macOS**: arrastra la aplicación a Aplicaciones y ejecuta una vez
  `xattr -dr com.apple.quarantine /Applications/Hybi.app`, o ábrela desde
  **Ajustes del sistema → Privacidad y seguridad → Abrir de todas formas**.
- **Linux**: el AppImage necesita `chmod +x` y la librería `libfuse2`. Los
  paquetes `.deb` y `.rpm` no necesitan nada.

Los instaladores se compilan en GitHub Actions a partir del código de la
etiqueta publicada, nunca en una máquina personal. Cada release incluye un
archivo `SHA256SUMS.txt` para comprobar que lo que descargaste es exactamente lo
que se publicó: mientras no haya firma, esa es la verificación que cuenta.

## Estado del proyecto

Hybi está en **alpha**. Lo que ya está hecho funciona y se usa a diario: abrir la
conexión, ver la conversación, enviar mensajes, el catálogo, la importación de
AsyncAPI, los entornos y los espacios de trabajo.

Lo que eso implica mientras dure esta fase:

- Siguen entrando funciones nuevas, así que la interfaz puede moverse de una
  versión a otra.
- El formato de los archivos guardados puede cambiar; se migra al abrir, pero
  conviene no confiarle todavía trabajo irrecuperable.
- Los fallos son esperables. Reportarlos es la mejor forma de ayudar.

## Lo que viene

Esta es la dirección del proyecto, contada por lo que vas a poder hacer. Sin
fechas: el orden puede cambiar, y cambia sobre todo con lo que pida la gente que
lo usa.

### Lo siguiente

- **Ver los mensajes que no son texto.** Hoy, cuando llega algo que no son
  letras, Hybi solo dice cuánto ocupa. Va a poder abrirse y mirarse por dentro.
- **Llevarte la conversación fuera.** Copiar un mensaje suelto o guardar la
  sesión entera en un archivo, para adjuntarla a un reporte o revisarla después.
- **Ver solo lo que te interesa.** Filtrar la conversación por lo que enviaste,
  lo que llegó o lo que falló, en vez de leerlo todo.
- **Repetir un mensaje que te llegó**, sin copiarlo a mano.
- **Que la aplicación recuerde cómo la dejaste**, empezando por el tema claro u
  oscuro.
- **Saber cuánto va moviendo cada conexión**: cuántos mensajes y cuánto pesan.

### Camino a la primera versión estable

- **Instaladores firmados.** Que Windows y macOS dejen de avisar de que el
  programa viene de un origen desconocido. Es lo más importante de esta lista.
- **Aviso de versión nueva** desde la propia aplicación, sin tener que pasar por
  la web.
- **Interfaz también en inglés**, manteniendo el español.
- **Más tipos de conexión.** Hoy Hybi habla WebSocket a secas; falta lo que se
  monta encima, empezando por Socket.IO, que es lo que usa mucha gente sin
  saberlo.
- **Pantalla de preferencias**, para ajustar la aplicación a tu gusto en lugar
  de aceptar lo que viene puesto.
- **Llevarte un espacio de trabajo a otro equipo**, o pasárselo a un compañero,
  en un solo archivo.
- **Ayuda con la autenticación**, para no tener que armar a mano la cabecera del
  token cada vez.
- **Envío repetido o programado**, para probar cómo aguanta un servidor.

### Más adelante

Ideas en el horizonte, todavía sin compromiso:

- Otros tipos de conexión en tiempo real, más allá de los WebSockets.
- Avisarte cuando un mensaje no cuadra con lo que el servidor dijo que iba a
  mandar.
- Comparar dos mensajes lado a lado para ver qué cambió.
- Compartir catálogos con el equipo.
- Un modo de prueba en el que Hybi haga de servidor.

Si algo de esta lista te urge, o falta lo que de verdad necesitas, dilo en un
[issue](https://github.com/joalvm/hybi/issues). Ese es el criterio para decidir
qué se hace antes.

## Licencia

Publicado bajo [GPL-3.0](LICENSE): puedes usarlo, estudiarlo, modificarlo y
compartirlo, y cualquier versión modificada que distribuyas debe seguir siendo
libre. El nombre «Hybi» y su logotipo no entran en esa licencia.

---

## Contribuir

A partir de aquí el texto se pone técnico, porque va dirigido a quien vaya a
tocar el código. La guía completa está en [CONTRIBUTING.md](CONTRIBUTING.md).

### Stack

Electron 43 sobre Node 24, React 19 con Zustand, Monaco como editor, Vite a
través de electron-vite, TypeScript en modo estricto, Vitest para pruebas
unitarias y Playwright-Electron para las de extremo a extremo. El proceso main
abre los sockets con `ws`; la interfaz nunca crea una conexión por su cuenta.

### Puesta en marcha

```bash
npm install
npm run dev
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Aplicación en desarrollo con recarga. |
| `npm run verify` | Lint + tipos + pruebas + build. Es lo que ejecuta la CI. |
| `npm run test:e2e` | Compila y lanza la app real contra un servidor de eco. |
| `npm run package` | Build sin instalador para QA local, en `release/`. |

### Estructura

```
src/main/       ventanas, menú, sockets, IPC y persistencia
src/preload/    puente tipado: la única superficie visible al renderer
src/renderer/   interfaz React (app/, features/, shared/, store/, ipc/)
src/shared/     dominio, contratos de IPC y resolución de variables
tests/          main/, renderer/, shared/ (Vitest) y e2e/ (Playwright)
```

### Reglas que se revisan en cada PR

- Ningún archivo pasa de 150 líneas; un componente por archivo.
- Solo el componente raíz de cada *feature* habla con el store.
- Nada de `useEffect` para derivar estado.
- `contextIsolation`, `sandbox` y CSP estricta se quedan como están; el preload
  nunca expone `ipcRenderer` en crudo.
- Solo llegan URLs `ws:` y `wss:` al socket, validadas en el proceso main.
- Los secretos se vacían antes de escribir el workspace a disco.
- La aplicación es un cliente genérico: nada en `src/` nombra un servidor o
  producto concreto.

### Flujo

Rama desde `main`, prueba que falle primero, implementación, `npm run verify` y
pull request con título en formato [Conventional Commits](https://www.conventionalcommits.org)
(`feat:`, `fix:`, `docs:`…). La CI corre `verify` en Linux, Windows y macOS, la
suite E2E, la auditoría de dependencias y CodeQL. `main` está protegida: se entra
por pull request y con todo en verde.

### Reportar una vulnerabilidad

En privado, siguiendo [SECURITY.md](SECURITY.md). Nunca en un issue público.

Al participar aceptas el [código de conducta](CODE_OF_CONDUCT.md).
