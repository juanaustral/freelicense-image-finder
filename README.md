# FreeLicense Image Finder

Buscador de imágenes con licencia **CC0** y **Dominio Público**, reunidas desde dos fuentes abiertas. No necesita API keys, cuentas ni instalación.

**Demo:** https://juanaustral.github.io/freelicense-image-finder/

## Problema que resuelve

Encontrar imágenes reutilizables sin riesgo legal exige entrar a varios sitios, revisar la licencia de cada archivo y recordar en cuál estaba cada cosa. Esta herramienta busca en un solo lugar y muestra la licencia, el autor y el enlace a la fuente de cada resultado.

## Usuarios

Diseñadores, docentes, creadores de contenido y cualquier persona que necesite imágenes para usar sin pagar y sin problemas de derechos.

## Cómo funciona

1. Escribí un término o tocá **Random Search** para explorar.
2. Elegí la fuente: **Openverse**, **Wikimedia Commons** o **All Sources** (las dos a la vez).
3. Elegí la licencia: **CC0**, **Dominio Público** o ambas.
4. Los resultados aparecen en una grilla con vista previa, autor y licencia.

Cada imagen tiene tres acciones:

- **Ojo:** abre la página de origen.
- **Link:** abre la URL directa de la imagen.
- **Descarga:** descarga el archivo.

## Fuentes

| Fuente | Contenido | API pública |
|---|---|---|
| Openverse | Imágenes CC0 y dominio público de varias colecciones | `api.openverse.org` |
| Wikimedia Commons | Archivos multimedia CC0 y dominio público | `commons.wikimedia.org` |

## Stack

- HTML, CSS y JavaScript puro, sin frameworks ni dependencias.
- Interfaz en español e inglés.
- Modo claro y oscuro, con preferencia guardada en el navegador.
- Publicado con GitHub Pages.

## Ejecutar localmente

No hay paso de compilación. Abrí `index.html` en el navegador, o servila con cualquier servidor estático:

```bash
python3 -m http.server 8000
```

## Versiones

La versión actual figura en el pie de la página. Al tocarla se abre el historial completo de cambios. Versiones recientes:

- **v1.7.0:** modo oscuro con preferencia persistente.
- **v1.3.1:** se quitó la API del Met Museum y Random Search pasó a generar términos de una o dos palabras.

## Limitaciones conocidas

- La calidad y el contenido dependen de lo que publican Openverse y Wikimedia Commons.
- Cada archivo conserva su licencia y su autor original. Revisá la página de origen antes de usar una imagen en un proyecto comercial.

## Licencia

[MIT](LICENSE). Copyright © 2026 Juan Martínez García.
