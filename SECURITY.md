# Política de seguridad

## Versiones con soporte

Solo la última versión publicada recibe correcciones de seguridad. Mientras el
proyecto esté en la serie `0.x`, cada versión nueva reemplaza a la anterior.

## Cómo reportar una vulnerabilidad

**No abras un issue público.** Usa el reporte privado de GitHub:

1. Entra en [Security → Report a vulnerability](https://github.com/joalvm/hybi/security/advisories/new).
2. Describe el fallo, el impacto y los pasos para reproducirlo.
3. Indica versión de Hybi y sistema operativo.

Recibirás una primera respuesta en un plazo razonable y se te mantendrá al tanto
del avance. La corrección se publica junto con un aviso de seguridad que da
crédito a quien reportó, salvo que prefieras permanecer anónimo. Te pedimos no
divulgar el fallo públicamente hasta que exista una versión corregida.

## Superficie de ataque que nos importa

Hybi es una aplicación de escritorio que abre conexiones WebSocket contra
servidores que elige la persona usuaria. Interesan especialmente:

- Escapes del aislamiento de contexto del renderer o del `preload`.
- Ejecución de código a partir de un documento AsyncAPI importado.
- Ejecución de código a partir del contenido de un mensaje recibido.
- Filtración a disco, a la red o a los registros de variables marcadas como
  secretas.
- Conexiones a esquemas distintos de `ws:` y `wss:`.

## Qué no se considera vulnerabilidad

- Que la aplicación se conecte a un servidor inseguro elegido de forma explícita
  por la persona usuaria.
- Resultados de escáneres automáticos sin un caso reproducible.
- Ausencia de firma de código en artefactos que la propia release marca como no
  firmados.

## Garantías del proceso de publicación

- Los binarios se compilan en GitHub Actions, no en máquinas personales.
- Cada release lleva `SHA256SUMS.txt` con la huella de cada artefacto.
- Cuando hay credenciales de firma configuradas, los artefactos se firman y se
  verifican dentro del propio flujo, y en macOS además se notarizan.
- Toda release nace en borrador y solo se publica tras revisión manual.
