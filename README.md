# FreeLicense Image Finder

Buscador de imágenes con licencia **CC0** y **Dominio Público**, reunidas desde dos fuentes abiertas. No necesita API keys, cuentas ni instalación.

**Demo:** https://juanaustral.github.io/freelicense-image-finder/

## Problema que resuelve

Encontrar imágenes reutilizables sin riesgo legal exige entrar a varios sitios, revisar la licencia de cada archivo y recordar en cuál estaba cada cosa. Esta herramienta busca en un solo lugar y muestra la licencia, el autor y el enlace a la fuente de cada resultado.

## Usuarios

Diseñadores, docentes, creadores de contenido y cualquier persona que necesite imágenes para usar sin pagar y sin problemas de derechos.

## Cómo funciona

1. Escribí un término o tocá **Búsqueda al azar** para explorar. Si la interfaz está en español, la consulta se traduce al inglés (las dos fuentes indexan sobre todo en inglés) y aparece un enlace para buscarla tal cual.
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

Cómo se garantiza la licencia:

- **Commons** filtra en el servidor con datos estructurados (`haswbstatement:P275=Q6938433` para CC0, `P6216=Q19652` para dominio público) y solo imágenes (`filetype:bitmap`). En el navegador se vuelve a comprobar la licencia de cada archivo.
- **Openverse** filtra con `license=cc0,pdm`. Cuando se buscan las dos fuentes, excluye su copia de Commons para no repetir resultados.
- La licencia de cada tarjeta enlaza a su texto legal. Es la que declara la fuente: revisá la página de origen antes de un uso comercial.

Otras fuentes evaluadas (2026-10-21): Openverse ya agrega Met, NASA, Rijksmuseum, Smithsonian, Europeana, NYPL y otras 40; sumarlas directo duplicaría resultados. Internet Archive se descartó: muchos archivos marcados CC0 no son imágenes o son spam. Unsplash, Pexels y Pixabay no son CC0.

## Stack

- HTML, CSS y JavaScript puro, sin frameworks ni dependencias.
- Interfaz en español e inglés.
- Modo claro y oscuro, con preferencia guardada en el navegador.
- La lógica de búsqueda está en `sources.js`; la interfaz, en `index.html`.
- Publicado con GitHub Pages.

## Ejecutar localmente

No hay paso de compilación. Abrí `index.html` en el navegador, o servila con cualquier servidor estático:

```bash
python3 -m http.server 8000
```

## Pruebas

Pruebas de regresión contra las APIs reales (Node 18 o superior): comprueban que cada resultado tenga la licencia pedida, la paginación y la traducción.

```bash
node --test tests/sources.test.js
```

## Versiones

La versión actual figura en el pie de la página. Al tocarla se abre el historial completo de cambios. Versiones recientes:

- **v1.8.0:** búsqueda más precisa (licencia filtrada en el servidor de Commons, miniaturas livianas, sin duplicados), traducción de consultas en español, una búsqueda nueva cancela la anterior, cada fuente muestra resultados apenas responde, licencia con enlace y aviso del límite de Openverse.
- **v1.7.0:** modo oscuro con preferencia persistente.
- **v1.3.1:** se quitó la API del Met Museum y Random Search pasó a generar términos de una o dos palabras.

## Limitaciones conocidas

- La calidad y el contenido dependen de lo que publican Openverse y Wikimedia Commons.
- Openverse permite 20 búsquedas por minuto y 200 por día sin registro, por IP. Al llegar al límite el sitio lo avisa y sigue con Commons. Además, Openverse suele tardar entre 10 y 15 segundos en responder.
- La traducción usa un diccionario de términos comunes y, para palabras sueltas, Wikidata. Lo que no reconoce se busca tal cual.
- Cada archivo conserva su licencia y su autor original. Revisá la página de origen antes de usar una imagen en un proyecto comercial.

## Licencia

[MIT](LICENSE). Copyright © 2026 Juan Martínez García.
