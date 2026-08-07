# Contribuir a Hybi

Gracias por el interés. Esta guía cubre lo que necesitas para levantar el
proyecto, dónde vive cada cosa y qué se revisa en un pull request.

Al contribuir aceptas el [Código de conducta](CODE_OF_CONDUCT.md) y que tu
aportación se publique bajo la licencia del proyecto ([GPL-3.0](LICENSE)).

## Requisitos

- Node 24 (la línea con la que se empaqueta Electron 43).
- Windows, macOS o Linux con soporte para Electron 43.
- Git.

## Puesta en marcha

```bash
npm install
npm run dev
```

Comandos habituales:

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Aplicación en modo desarrollo con recarga. |
| `npm run lint` | ESLint sobre todo el repositorio. |
| `npm run typecheck` | Compilación de tipos de los tres tsconfig. |
| `npm test` | Pruebas unitarias con Vitest (proyectos `node` y `renderer`). |
| `npm run verify` | Lint + tipos + pruebas + build. Es lo que ejecuta la CI. |
| `npm run test:e2e` | Compila y lanza la app real con Playwright-Electron. |
| `npm run package` | Build sin instalador para QA local, en `release/`. |

`npm run test:e2e` usa el propio binario de Electron: no descarga navegadores.
En Linux necesita un display; en CI se ejecuta bajo `xvfb-run`.

## Estructura

```
src/main/       proceso principal: ventanas, menú, sockets, IPC, persistencia
src/preload/    puente tipado que expone la única superficie visible al renderer
src/renderer/   interfaz React: app/, features/, shared/, store/, ipc/
src/shared/     dominio, contratos de IPC y resolución de variables
resources/      entitlements de macOS e imágenes en resources/images/
tests/          main/, renderer/, shared/ (Vitest) y e2e/ (Playwright)
```

## Reglas de arquitectura

- **Ningún archivo de `src/` pasa de 225 líneas de código**, sin contar
  comentarios ni blancos. Si crece, se parte. No hace falta contarlas a mano: lo
  comprueba `max-lines` en `eslint.config.js`. `tests/` queda fuera a propósito,
  porque una suite crece por acumulación de casos y partirla sólo dispersa lo
  que se lee junto.
- Un componente por archivo. Solo el componente raíz de cada *feature* habla con
  el store; los hijos reciben props.
- Nada de `useEffect` para derivar estado: se deriva en render o con un selector.
- Monaco monta una instancia por rol y cambia de modelo con `setModel`; no se
  remonta el editor.
- La actividad llega en lotes desde el proceso main y se pinta virtualizada sobre
  un búfer acotado.
- La aplicación es un cliente genérico: nada en `src/` puede nombrar un servidor,
  producto o ruta concreta.
- Sin base de datos ni servicios externos. La persistencia son archivos JSON en
  `app.getPath('userData')`.

## Reglas de seguridad

Son innegociables y se revisan en cada PR:

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, CSP
  estricta y `setWindowOpenHandler` devolviendo `deny`.
- El preload expone solo la superficie tipada del puente. Nunca `ipcRenderer` en
  crudo.
- Solo llegan URLs `ws:` y `wss:` a `new WebSocket(...)`, validadas en el proceso
  main.
- Las variables marcadas como secretas viven en memoria y se vacían antes de
  escribir el workspace a disco.
- El mensaje se envía tal cual queda tras resolver `{{variables}}`: nada se
  envuelve ni se transforma por el camino.

## Versiones fijadas

Las dependencias van con versión exacta, sin rangos `^`, y algunas líneas están
congeladas a propósito:

- Node 24 y Electron 43; `@types/node` se queda en 24.x.
- Vite 7.x mientras `electron-vite@5` declare `vite ^5 || ^6 || ^7`.
- TypeScript 5.9.x mientras `typescript-eslint@8` declare `typescript <6.1.0`.
- `@vitejs/plugin-react` en 5.x; la 6 exige Vite 8.

Si un PR sube una de esas líneas, tiene que explicar por qué el bloqueo ya no
aplica.

## Flujo de trabajo

1. Abre un issue antes de un cambio grande. Para correcciones pequeñas, ve
   directo al PR.
2. Rama desde `main` con un nombre descriptivo (`fix/url-scheme-check`).
3. **Escribe la prueba antes que la implementación** y comprueba que falla.
4. Implementa solo el alcance del issue. Nada de mejoras de paso.
5. Ejecuta `npm run verify` (y `npm run test:e2e` si tocas la interfaz o el
   proceso main).
6. Revisa tu propio diff: secretos fuera del disco, esquemas de URL restringidos,
   timers y listeners con su limpieza.
7. Si el cambio se nota desde la aplicación, añade su línea a
   [`CHANGELOG.md`](CHANGELOG.md) bajo `Unreleased`, en este mismo PR.
8. Abre el PR contra `main` y completa la plantilla.

### Commits y títulos de PR

El título del PR sigue [Conventional Commits](https://www.conventionalcommits.org)
y la CI lo verifica:

```
feat(catalog): permite duplicar un evento
fix(main): rechaza esquemas distintos de ws y wss
docs: aclara el flujo de importación de AsyncAPI
```

Tipos válidos: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`,
`chore`, `revert`. Los PR se integran con *squash*, así que el título del PR es
el mensaje que queda en el historial; el cuerpo de los commits internos no
importa tanto, pero mantenlo legible.

### Qué comprueba la CI

Cada PR ejecuta `npm run verify` en Linux, Windows y macOS, la suite E2E en
Linux, una auditoría de dependencias de producción, el análisis de CodeQL y la
revisión de dependencias nuevas. `main` está protegida: no se puede empujar
directo ni forzar el historial, y un PR solo se integra con todas las
comprobaciones en verde y las conversaciones resueltas.

## Publicación de versiones

Solo el mantenedor publica. El proceso es:

1. Subir la versión en `package.json` y cerrar la sección `Unreleased` de
   `CHANGELOG.md` bajo el número que se publica.
2. Etiquetar con `vX.Y.Z`; la etiqueta debe coincidir con esa versión o la CI
   falla.
3. El flujo de release compila los tres sistemas, firma cuando hay credenciales
   configuradas, genera `SHA256SUMS.txt` y crea el release **en borrador**.
4. El mantenedor revisa los artefactos y publica.

Nunca se guardan certificados ni claves en el repositorio: viven como secretos
del repositorio en GitHub.

## Marca

El código está bajo GPL-3.0, pero el nombre «Hybi» y su logotipo no. Si publicas
una versión modificada, cámbiale el nombre y el icono.
