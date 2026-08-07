# Marcas de los transportes

Los originales de los que se trazaron los componentes de
`src/renderer/shared/ui/logos/`. No los lee ni el build ni la aplicación: están
aquí para que se pueda comparar el trazo con su fuente.

- `websocket-logo.svg` — un solo path plano en `#231F20`. El componente reusa el
  path tal cual y lo pinta con `currentColor`.
- `socketio-logo.svg` — bicolor: disco negro con el anillo y las flechas pintados
  de blanco encima. Ese blanco no es blanco, es el fondo que haya detrás, y
  detrás hay una pestaña que cambia de tono. El componente lo redibuja como un
  solo path con `fill-rule="evenodd"`, así los huecos son huecos.

Ambas son marcas de terceros. Se usan para identificar el protocolo que la
conexión habla, que es uso nominativo: no indican respaldo ni afiliación de sus
titulares con Hybi.
