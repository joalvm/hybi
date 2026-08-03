## Cómo instalar

**Windows.** Ejecuta el `.exe`. Como el instalador no está firmado, aparece la
pantalla azul de SmartScreen: pulsa **Más información** y luego **Ejecutar de
todas formas**. El `.zip` es la versión portable, sin instalador.

**macOS.** Abre el `.dmg`, arrastra Hybi a Aplicaciones y ejecuta esto una vez:

```bash
xattr -dr com.apple.quarantine /Applications/Hybi.app
```

Sin ese paso macOS dirá que la aplicación «está dañada», porque pone en
cuarentena todo lo que se descarga sin notarizar. También puedes abrirla desde
**Ajustes del sistema → Privacidad y seguridad → Abrir de todas formas**.

**Linux.** El AppImage necesita permiso de ejecución y FUSE 2:

```bash
chmod +x Hybi-*-linux-x86_64.AppImage
./Hybi-*-linux-x86_64.AppImage
```

Si aparece un error de `libfuse.so.2`, instala `libfuse2` (Debian/Ubuntu) o
`fuse-libs` (Fedora). Los paquetes `.deb` y `.rpm` no necesitan nada de esto.

## Sobre la firma y los checksums

Hybi todavía no tiene certificados de firma de código, así que los instaladores
salen sin firmar y el sistema avisará de que vienen de un origen desconocido. El
aviso es correcto: mientras no haya firma, la verificación que cuenta es el
checksum de la tabla de arriba. Los binarios se compilan en GitHub Actions a
partir del código de esta etiqueta, nunca en una máquina personal.

Para comprobar una descarga:

```bash
# macOS y Linux
shasum -a 256 --ignore-missing -c SHA256SUMS.txt
```

```powershell
# Windows
(Get-FileHash .\Hybi-*-win-x64.exe -Algorithm SHA256).Hash.ToLower()
```

Si el resultado no coincide con el checksum publicado, no lo instales.
