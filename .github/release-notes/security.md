## Sobre la firma y los checksums

Hybi todavía no tiene certificados de firma de código, así que algunos sistemas
pueden advertir que los instaladores vienen de un origen desconocido. Verifica
la descarga antes de abrirla: el asset `SHA256SUMS.txt` contiene la huella de
cada archivo publicado en esta release.

```bash
# macOS y Linux
shasum -a 256 Hybi-<archivo>
```

```powershell
# Windows
(Get-FileHash .\Hybi-<archivo> -Algorithm SHA256).Hash.ToLower()
```

El resultado debe coincidir con la línea del archivo en `SHA256SUMS.txt`.
