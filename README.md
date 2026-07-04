# FreeLicense Image Finder

Busca imágenes con licencia **CC0** y **Dominio Público** desde múltiples fuentes gratuitas, sin necesidad de API keys.

**Demo:** https://juanaustral.github.io/freelicense-image-finder/

## Fuentes

| Fuente | Contenido | API |
|--------|-----------|-----|
| **Openverse** | 800M+ imágenes CC0/PD (Flickr, museos, etc.) | api.openverse.org |
| **Wikimedia Commons** | 90M+ archivos multimedia CC0/PD | commons.wikimedia.org |
| **Met Museum** | 490K+ obras de arte en dominio público | collectionapi.metmuseum.org |

Se puede filtrar por fuente individual o usar "All Sources" para buscar en las tres simultáneamente.

## Como funciona

1. Escribis un termino de busqueda o tocas **Random Search** para explorar
2. Seleccionas fuente: Openverse, Wikimedia Commons, Met Museum o All Sources
3. Filtro de licencia: CC0, Public Domain o Both
4. Resultados en grilla con vista previa, autor, licencia y acciones

Cada imagen tiene 3 acciones:
- **Ojo** -- ver pagina de origen
- **Link** -- abrir URL directa
- **Descarga** -- descargar la imagen

## Stack

- HTML / CSS / JS vanilla -- sin frameworks ni dependencias
- APIs publicas sin autenticacion (Openverse, Wikimedia Commons, Met Museum)
- i18n completo EN / ES
- Hosting: GitHub Pages
- Version v1.3.0

## Changelog

El footer muestra la version actual. Clickearla abre un modal con el historial de cambios completo.

## Licencia

MIT -- podes usarlo, modificarlo y compartirlo libremente.

---

*Desarrollado por [Juan Martinez Garcia](https://juanmartinezgarcia.com)*
