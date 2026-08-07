## Qué cambia

<!-- Una o dos frases. Qué hace este PR y por qué. -->

Cierra #

## Cómo se probó

<!-- Comandos ejecutados y comprobación manual, si aplica. -->

- [ ] `npm run verify`
- [ ] `npm run test:e2e` (si toca la interfaz o el proceso main)

## Lista de control

- [ ] El título del PR sigue Conventional Commits (`feat:`, `fix:`, `docs:`…).
- [ ] Hay una prueba que falla sin este cambio.
- [ ] Ningún archivo de `src/` pasa de 225 líneas de código (lo comprueba `max-lines`).
- [ ] `CHANGELOG.md` tiene su línea bajo `Unreleased`, si el cambio se nota desde la app.
- [ ] El cambio no acopla la aplicación a ningún servidor o producto concreto.
- [ ] Los secretos siguen fuera del disco y solo llegan URLs `ws:`/`wss:` al socket.

## Capturas

<!-- Solo si el cambio se ve. Borra la sección si no aplica. -->
