/* FreeLicense Image Finder — image sources (Openverse, Wikimedia Commons)
   and Spanish → English query translation (Wikidata).
   Plain script: in the browser it defines window.FLISources; in Node it is
   also exported with module.exports so tests can run against the live APIs. */
(function (root) {
  'use strict';

  var PER_PAGE = 20;

  var LICENSE_URLS = {
    cc0: 'https://creativecommons.org/publicdomain/zero/1.0/',
    pdm: 'https://creativecommons.org/publicdomain/mark/1.0/',
  };

  // Commons structured data: P275 = copyright license (Q6938433 = CC0),
  // P6216 = copyright status (Q19652 = public domain). Filtering on the server
  // keeps every page full instead of discarding most hits in the browser.
  var COMMONS_LICENSE_QUERY = {
    'cc0': 'haswbstatement:P275=Q6938433',
    'pdm': 'haswbstatement:P6216=Q19652',
    'cc0,pdm': 'haswbstatement:P275=Q6938433|P6216=Q19652',
  };

  var PROVIDER_NAMES = {
    flickr: 'Flickr', inaturalist: 'iNaturalist', wikimedia: 'Wikimedia Commons',
    met: 'The Met', nasa: 'NASA', rijksmuseum: 'Rijksmuseum', nypl: 'NYPL',
    europeana: 'Europeana', smk: 'SMK', stocksnap: 'StockSnap', rawpixel: 'rawpixel',
    clevelandmuseum: 'Cleveland Museum of Art', brooklynmuseum: 'Brooklyn Museum',
    museumsvictoria: 'Museums Victoria', geographorguk: 'Geograph',
  };

  function SourceError(source, message, code) {
    var err = new Error(message);
    err.source = source;
    err.code = code || 'http';
    return err;
  }

  // Small in-memory cache: repeated searches (changing a chip back and forth,
  // going back to a previous query) do not spend Openverse's anonymous quota.
  var cache = new Map();
  var CACHE_MAX = 100;

  async function fetchJson(source, url, signal) {
    if (cache.has(url)) return cache.get(url);
    var res = await fetch(url, { signal: signal, headers: api.headers });
    if (res.status === 429) throw SourceError(source, 'HTTP 429', 'rate_limit');
    if (!res.ok) throw SourceError(source, 'HTTP ' + res.status, 'http');
    var data = await res.json();
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(url, data);
    return data;
  }

  function decodeEntities(s) {
    return s.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }

  function stripHtml(s) {
    return decodeEntities(String(s || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
  }

  // Only http(s) links reach the page; metadata comes from third parties.
  function safeUrl(u) {
    u = String(u || '').trim();
    return /^https?:\/\//i.test(u) ? u : '';
  }

  function providerName(code) {
    if (!code) return '';
    return PROVIDER_NAMES[code] || code.charAt(0).toUpperCase() + code.slice(1).replace(/_/g, ' ');
  }

  function licenseAllowed(license, filter) {
    return filter.split(',').indexOf(license) !== -1;
  }

  // ── Openverse ──────────────────────────────────
  // Anonymous limits (response headers): 20 requests/min, 200/day per IP;
  // thumbnails have their own quota of 1000/day.
  async function searchOpenverse(opts) {
    var params = new URLSearchParams({
      q: opts.query, license: opts.filter,
      page: String(opts.page || 1), page_size: String(PER_PAGE),
    });
    // Openverse also indexes Commons; skip it when Commons is queried directly.
    if (opts.excludeWikimedia) params.set('excluded_source', 'wikimedia');
    var data;
    try {
      data = await fetchJson('openverse', 'https://api.openverse.org/v1/images/?' + params, opts.signal);
    } catch (err) {
      // Anonymous users can only page so deep; past that the API answers 400.
      if (err.code === 'http' && /400/.test(err.message) && opts.page > 1) return { results: [], done: true };
      throw err;
    }
    var results = (data.results || []).filter(function (img) {
      return licenseAllowed(img.license, opts.filter);
    }).map(function (img) {
      return {
        source: 'openverse', title: stripHtml(img.title),
        thumb: safeUrl(img.thumbnail || img.url), url: safeUrl(img.url), pageUrl: safeUrl(img.foreign_landing_url),
        author: img.creator || '', authUrl: safeUrl(img.creator_url),
        provider: providerName(img.source || img.provider),
        license: img.license, licVer: img.license_version || '',
        licenseUrl: safeUrl(img.license_url) || LICENSE_URLS[img.license],
      };
    });
    var page = opts.page || 1;
    return { results: results, done: !data.page_count || page >= data.page_count };
  }

  // ── Wikimedia Commons ──────────────────────────
  function commonsLicense(meta) {
    var short = (meta.LicenseShortName && meta.LicenseShortName.value || '').toLowerCase();
    var copyrighted = (meta.Copyrighted && meta.Copyrighted.value || '').toLowerCase();
    if (short.indexOf('cc0') !== -1 || short.indexOf('cc-zero') !== -1 || short.indexOf('cc 0') !== -1) return 'cc0';
    if (short.indexOf('public domain') !== -1 || short === 'pdm' || /^pd\b/.test(short) || copyrighted === 'false') return 'pdm';
    return null;
  }

  async function searchCommons(opts) {
    var params = new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2', origin: '*',
      generator: 'search', gsrnamespace: '6',
      gsrsearch: opts.query + ' filetype:bitmap ' + COMMONS_LICENSE_QUERY[opts.filter],
      gsrlimit: String(PER_PAGE), gsroffset: String(opts.offset || 0),
      prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '480',
      iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Copyrighted|Artist|ObjectName',
    });
    var data = await fetchJson('wikimedia', 'https://commons.wikimedia.org/w/api.php?' + params, opts.signal);
    if (data.error) throw SourceError('wikimedia', data.error.code || 'API error', 'http');
    var pages = (data.query && data.query.pages || []).slice().sort(function (a, b) { return a.index - b.index; });
    var results = [];
    pages.forEach(function (pg) {
      var ii = pg.imageinfo && pg.imageinfo[0];
      if (!ii) return;
      var meta = ii.extmetadata || {};
      // Safety net: structured data and the file's license template can disagree.
      var license = commonsLicense(meta);
      if (!license || !licenseAllowed(license, opts.filter)) return;
      // Some files store the credit as escaped HTML (&lt;a href=...&gt;).
      var artist = decodeEntities(meta.Artist && meta.Artist.value || '');
      var href = artist.match(/href="\s*([^"]+?)\s*"/);
      results.push({
        source: 'wikimedia',
        title: stripHtml(meta.ObjectName && meta.ObjectName.value) ||
          pg.title.replace(/^File:/, '').replace(/\.\w+$/, ''),
        thumb: ii.thumburl || ii.url, url: ii.url, pageUrl: ii.descriptionurl,
        author: stripHtml(artist),
        authUrl: href ? safeUrl(href[1].indexOf('//') === 0 ? 'https:' + href[1] : href[1]) : '',
        provider: 'Wikimedia Commons', license: license, licVer: '',
        licenseUrl: safeUrl(meta.LicenseUrl && meta.LicenseUrl.value) || (license === 'cc0' ? LICENSE_URLS.cc0 : ii.descriptionurl),
      });
    });
    var next = data.continue && data.continue.gsroffset;
    return { results: results, nextOffset: next, done: next === undefined };
  }

  // ── Spanish → English ──────────────────────────
  // Both indexes are mostly in English ("montaña" finds "Montana"). A small
  // dictionary covers the usual photo terms; Wikidata is only a fallback for
  // single words, and only when its top hit is a common noun. Otherwise the
  // query is left as typed.
  var ES_EN = (
    'gato:cat,perro:dog,caballo:horse,vaca:cow,oveja:sheep,cerdo:pig,gallina:chicken,pajaro:bird,ave:bird,' +
    'pez:fish,pescado:fish,mariposa:butterfly,abeja:bee,insecto:insect,arana:spider,leon:lion,tigre:tiger,oso:bear,' +
    'lobo:wolf,zorro:fox,conejo:rabbit,raton:mouse,mono:monkey,elefante:elephant,jirafa:giraffe,ballena:whale,' +
    'delfin:dolphin,tortuga:turtle,serpiente:snake,rana:frog,buho:owl,aguila:eagle,pato:duck,animal:animal,' +
    'cachorro:puppy,gatito:kitten,montana:mountain,cerro:hill,colina:hill,volcan:volcano,rio:river,lago:lake,' +
    'mar:sea,oceano:ocean,playa:beach,costa:coast,isla:island,bosque:forest,selva:jungle,desierto:desert,' +
    'cascada:waterfall,cielo:sky,nube:cloud,lluvia:rain,nieve:snow,niebla:fog,tormenta:storm,rayo:lightning,' +
    'sol:sun,luna:moon,estrella:star,arcoiris:rainbow,atardecer:sunset,amanecer:sunrise,noche:night,dia:day,' +
    'paisaje:landscape,naturaleza:nature,campo:countryside,pradera:meadow,valle:valley,glaciar:glacier,piedra:stone,' +
    'roca:rock,arena:sand,tierra:earth,agua:water,fuego:fire,hielo:ice,viento:wind,ola:wave,flor:flower,' +
    'arbol:tree,hoja:leaf,planta:plant,jardin:garden,pasto:grass,cesped:grass,hongo:mushroom,fruta:fruit,' +
    'manzana:apple,naranja:orange,uva:grape,verdura:vegetable,comida:food,pan:bread,cafe:coffee,te:tea,vino:wine,' +
    'cerveza:beer,queso:cheese,carne:meat,postre:dessert,torta:cake,pastel:cake,ciudad:city,pueblo:village,' +
    'calle:street,avenida:avenue,puente:bridge,edificio:building,casa:house,iglesia:church,catedral:cathedral,' +
    'castillo:castle,torre:tower,ruina:ruins,plaza:square,parque:park,mercado:market,tienda:shop,oficina:office,' +
    'escuela:school,universidad:university,biblioteca:library,museo:museum,hospital:hospital,fabrica:factory,' +
    'puerto:harbor,faro:lighthouse,ruta:road,camino:path,carretera:highway,auto:car,coche:car,carro:car,' +
    'tren:train,avion:airplane,barco:ship,bote:boat,bicicleta:bicycle,moto:motorcycle,colectivo:bus,autobus:bus,' +
    'camion:truck,persona:person,gente:people,hombre:man,mujer:woman,nino:child,nina:girl,bebe:baby,familia:family,' +
    'retrato:portrait,cara:face,rostro:face,mano:hand,ojo:eye,trabajo:work,trabajador:worker,deporte:sport,' +
    'futbol:soccer,musica:music,baile:dance,danza:dance,fiesta:party,boda:wedding,libro:book,papel:paper,' +
    'mapa:map,reloj:clock,computadora:computer,telefono:phone,tecnologia:technology,herramienta:tool,' +
    'madera:wood,metal:metal,vidrio:glass,textura:texture,patron:pattern,fondo:background,color:color,' +
    'rojo:red,azul:blue,verde:green,amarillo:yellow,negro:black,blanco:white,gris:gray,dorado:golden,' +
    'viejo:old,antiguo:antique,vintage:vintage,abstracto:abstract,arte:art,pintura:painting,dibujo:drawing,' +
    'escultura:sculpture,arquitectura:architecture,invierno:winter,verano:summer,otono:autumn,primavera:spring,' +
    'navidad:christmas,espacio:space,planeta:planet,mascota:pet,ventana:window,puerta:door,silla:chair,mesa:table,' +
    'cocina:kitchen,luz:light,sombra:shadow,humo:smoke,mate:mate,vela:candle,corazon:heart'
  ).split(',').reduce(function (d, pair) { var kv = pair.split(':'); d[kv[0]] = kv[1]; return d; }, {});

  // Kept out of word-by-word translation ("ciudad de noche" → "city night").
  var ES_STOPWORDS = { de: 1, del: 1, la: 1, el: 1, los: 1, las: 1, en: 1, con: 1, y: 1, un: 1, una: 1, al: 1, por: 1, para: 1 };

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  }

  // gatos → gato, flores → flor, ciudades → ciudad, luces → luz.
  function singulars(w) {
    var out = [w];
    if (/ces$/.test(w)) out.push(w.slice(0, -3) + 'z');
    if (/es$/.test(w)) out.push(w.slice(0, -2));
    if (/s$/.test(w)) out.push(w.slice(0, -1));
    return out;
  }

  function lookupWord(w) {
    var forms = singulars(w);
    for (var i = 0; i < forms.length; i++) if (ES_EN[forms[i]]) return ES_EN[forms[i]];
    return null;
  }

  function translateLocal(q) {
    var words = q.split(' ').filter(function (w) { return !ES_STOPWORDS[w]; });
    if (!words.length) return null;
    var out = [];
    for (var i = 0; i < words.length; i++) {
      var en = lookupWord(words[i]);
      if (!en) return null;
      out.push(en);
    }
    // Spanish puts the adjective after the noun: "gato negro" → "black cat".
    if (out.length === 2 && /^(red|blue|green|yellow|black|white|gray|golden|old|antique|vintage|abstract)$/.test(out[1])) out.reverse();
    return out.join(' ');
  }

  async function translateWikidata(word, signal) {
    var params = new URLSearchParams({
      action: 'wbsearchentities', search: word, language: 'es', uselang: 'en',
      strictlanguage: '1', type: 'item', limit: '1', format: 'json', origin: '*',
    });
    var data = await fetchJson('wikidata', 'https://www.wikidata.org/w/api.php?' + params, signal);
    var hit = data.search && data.search[0];
    if (!hit || !hit.label) return null;
    var m = hit.match || {};
    var text = norm(m.text);
    if (m.language !== 'es' || (m.type !== 'label' && m.type !== 'alias')) return null;
    if (text !== word && text.indexOf(word + ' ') !== 0) return null;
    // A capitalized English label is a proper name (Flores Island, Gato submarine).
    if (hit.label.charAt(0) !== hit.label.charAt(0).toLowerCase()) return null;
    if (/[()\d,:]/.test(hit.label) || hit.label.split(' ').length > 3) return null;
    return hit.label;
  }

  async function translateQuery(query, signal) {
    var q = norm(query);
    if (!q) return null;
    var en = translateLocal(q);
    if (!en && q.indexOf(' ') === -1) {
      var forms = singulars(q);
      for (var i = 0; i < forms.length && !en; i++) en = await translateWikidata(forms[i], signal);
    }
    if (!en || norm(en) === q) return null;
    return en;
  }

  var api = {
    PER_PAGE: PER_PAGE, LICENSE_URLS: LICENSE_URLS,
    // Extra request headers; empty in the browser. Node tests set a
    // User-Agent, which Wikimedia requires from non-browser clients.
    headers: {},
    searchOpenverse: searchOpenverse, searchCommons: searchCommons,
    translateQuery: translateQuery, commonsLicense: commonsLicense,
    stripHtml: stripHtml, clearCache: function () { cache.clear(); },
  };
  root.FLISources = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
