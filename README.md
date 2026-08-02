<p align="center">
  <img src="resources/images/icon.png" alt="Hybi" width="112" height="112">
</p>

<h1 align="center">Hybi</h1>

<p align="center"><strong>Connect. Inspect. Replay.</strong></p>

<p align="center">
  Una aplicación de escritorio para trabajar con conexiones en tiempo real.
</p>

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

Las versiones publicadas están en la
[página de releases](https://github.com/joalvm/hybi/releases), con instaladores
para Windows, macOS y Linux.

Cada release incluye un archivo `SHA256SUMS.txt` para comprobar que lo que
descargaste es exactamente lo que se publicó.

## Estado del proyecto

Hybi está en desarrollo activo y todavía en versiones `0.x`: es utilizable, pero
puede cambiar entre versiones. Los fallos y las ideas se reportan en la
[sección de issues](https://github.com/joalvm/hybi/issues).

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
