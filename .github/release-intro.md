> [!IMPORTANT]
> **Versión alpha.** Hybi ya se puede usar, pero sigue en construcción: faltan
> funciones, algunas cosas cambiarán de sitio y pueden aparecer fallos. Si algo
> se rompe, cuéntalo en [issues](https://github.com/joalvm/hybi/issues).

## Qué descargar

| Sistema | Archivo |
| --- | --- |
| Windows 10/11 (64 bits) | `Hybi-<versión>-win-x64.exe` (instalador) o `-win-x64.zip` (portable) |
| macOS (Intel y Apple Silicon) | `Hybi-<versión>-mac-universal.dmg` |
| Linux (cualquier distro) | `Hybi-<versión>-linux-x64.AppImage` |
| Debian / Ubuntu | `Hybi-<versión>-linux-x64.deb` |
| Fedora / RHEL / openSUSE | `Hybi-<versión>-linux-x64.rpm` |

## Los instaladores no están firmados

Hybi todavía no tiene certificados de firma de código, así que tu sistema va a
avisar de que el programa viene de un origen desconocido. El aviso es correcto:
lo que garantiza que el archivo es el que se publicó aquí es el checksum, no una
firma. Los binarios se compilan en GitHub Actions a partir del código de esta
etiqueta, nunca en una máquina personal.

**Windows.** Al abrir el `.exe` aparece la pantalla azul de SmartScreen. Pulsa
**Más información** y luego **Ejecutar de todas formas**.

**macOS.** Abre el `.dmg`, arrastra Hybi a Aplicaciones y ejecuta esto una vez:

```bash
xattr -dr com.apple.quarantine /Applications/Hybi.app
```

Sin ese paso macOS dirá que la aplicación «está dañada», porque marca en
cuarentena todo lo que se descarga sin notarizar. También puedes abrirla desde
**Ajustes del sistema → Privacidad y seguridad → Abrir de todas formas**.

**Linux.** El AppImage necesita permiso de ejecución y FUSE 2:

```bash
chmod +x Hybi-*-linux-x64.AppImage
./Hybi-*-linux-x64.AppImage
```

Si aparece un error de `libfuse.so.2`, instala `libfuse2` (Debian/Ubuntu) o
`fuse-libs` (Fedora). Los paquetes `.deb` y `.rpm` no necesitan nada de esto.

## Comprobar la descarga

`SHA256SUMS.txt` trae la huella de cada archivo publicado.

```bash
# macOS y Linux
shasum -a 256 --ignore-missing -c SHA256SUMS.txt
```

```powershell
# Windows
(Get-FileHash .\Hybi-*-win-x64.exe -Algorithm SHA256).Hash.ToLower()
```

El resultado tiene que coincidir con la línea correspondiente de
`SHA256SUMS.txt`. Si no coincide, no lo instales.

---
