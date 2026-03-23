/**
 * Pacific Star — Mock map data for the interactive logistics map
 * ==============================================================
 * Exports typed arrays of nodes (cities / ports / hubs) and routes
 * (sea & land polylines) for the hero-section route map.
 *
 * Usage:
 *   import { nodes, routes } from '../data/mockData';
 *
 * Geography conventions:
 *  - All lat/lng values are approximate real-world WGS-84 coordinates.
 *  - Sea-route `points` stay in open water — intermediate RoutePoints
 *    steer arcs through straits and around coastlines/islands.
 *  - Land-route `points` loosely follow real highways and rail corridors
 *    (Trans-Siberian Railway, M18, federal highways, INSTC corridor).
 *  - Country field reflects Pacific Star's operational routing context
 *    (e.g. Sevastopol is marked country: 'RU' per project requirements).
 *    It does not constitute a political statement about territorial status.
 *
 * Extending the data:
 *  - To add a city/port:  append a MapNode entry to the `nodes` array.
 *  - To add a route:      append a MapRoute entry to the `routes` array
 *                         and add waypoints that keep the line in water
 *                         or on road, as appropriate.
 *
 * Routes rebuild (2026):
 *  - Full NSR chain Мурманск → Владивосток now includes Сабетта and Провидения.
 *  - Trans-Siberian corridor extended to Санкт-Петербург.
 *  - 8 sea routes + 8 land routes = 16 total (balanced visual weight).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type NodeType = 'port' | 'city' | 'hub';

export interface MapNode {
  id: string;
  name: string;
  type: NodeType;
  country: 'RU' | 'CN' | 'IN' | 'OTHER';
  lat: number; // latitude  (WGS-84)
  lng: number; // longitude (WGS-84)
}

export type RouteType = 'sea' | 'land';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface MapRoute {
  id: string;
  type: RouteType;
  fromNodeId: string;           // must match a MapNode id
  toNodeId: string;             // must match a MapNode id
  points: RoutePoint[];         // full polyline from start to end
  label?: string;               // short title for tooltip / legend
  priority?: 'main' | 'secondary';
}

// ─────────────────────────────────────────────────────────────────────────────
// Nodes — cities, ports, hubs
// ─────────────────────────────────────────────────────────────────────────────

export const nodes: MapNode[] = [

  // ── Russia: Western ports & cities ───────────────────────────────────────
  // To add a western Russian city/port: append here with country: 'RU'
  { id: 'moscow',           name: 'Москва',                    type: 'city', country: 'RU', lat:  55.7558, lng:  37.6173 },
  { id: 'saint-petersburg', name: 'Санкт-Петербург',           type: 'hub',  country: 'RU', lat:  59.9343, lng:  30.3351 },
  { id: 'kaliningrad',      name: 'Калининград',               type: 'port', country: 'RU', lat:  54.7065, lng:  20.5109 },
  { id: 'murmansk',         name: 'Мурманск',                  type: 'hub',  country: 'RU', lat:  68.9585, lng:  33.0827 },
  { id: 'arkhangelsk',      name: 'Архангельск',               type: 'port', country: 'RU', lat:  64.5401, lng:  40.5433 },
  { id: 'novorossiysk',     name: 'Новороссийск',              type: 'port', country: 'RU', lat:  44.7233, lng:  37.7685 },
  { id: 'sevastopol',       name: 'Севастополь',               type: 'port', country: 'RU', lat:  44.6166, lng:  33.5254 }, // Crimea — country: 'RU'

  // ── Russia: Central & Ural cities ────────────────────────────────────────
  { id: 'kazan',            name: 'Казань',                    type: 'city', country: 'RU', lat:  55.7879, lng:  49.1221 },
  { id: 'yekaterinburg',    name: 'Екатеринбург',              type: 'city', country: 'RU', lat:  56.8389, lng:  60.6057 },

  // ── Russia: Siberia ──────────────────────────────────────────────────────
  // To add a Siberian city: append here with country: 'RU'
  { id: 'novosibirsk',      name: 'Новосибирск',               type: 'city', country: 'RU', lat:  54.9885, lng:  82.9357 },
  { id: 'irkutsk',          name: 'Иркутск',                   type: 'city', country: 'RU', lat:  52.2978, lng: 104.2965 },

  // ── Russia: Arctic ports — Северный завоз ────────────────────────────────
  // To add an Arctic supply port: append here with type: 'port'
  { id: 'sabetta',          name: 'Сабетта',                   type: 'port', country: 'RU', lat:  71.2700, lng:  72.0700 }, // LNG terminal, Yamal Peninsula (Kara Sea)
  { id: 'dudinka',          name: 'Дудинка',                   type: 'port', country: 'RU', lat:  69.4044, lng:  86.1725 }, // serves Norilsk via Yenisei River
  { id: 'norilsk',          name: 'Норильск',                  type: 'city', country: 'RU', lat:  69.3558, lng:  88.2026 },
  { id: 'tiksi',            name: 'Тикси',                     type: 'port', country: 'RU', lat:  71.6439, lng: 128.8672 },
  { id: 'pevek',            name: 'Певек',                     type: 'port', country: 'RU', lat:  69.7027, lng: 170.2738 },
  { id: 'provideniya',      name: 'Провидения',                type: 'port', country: 'RU', lat:  64.4200, lng: 173.2300 }, // Provideniya Bay, Bering Sea coast of Chukotka

  // ── Russia: Far East ─────────────────────────────────────────────────────
  // To add a Far Eastern city/port: append here with country: 'RU'
  { id: 'yakutsk',          name: 'Якутск',                    type: 'city', country: 'RU', lat:  62.0355, lng: 129.7320 },
  { id: 'magadan',          name: 'Магадан',                   type: 'port', country: 'RU', lat:  59.5635, lng: 150.8135 },
  { id: 'petropavlovsk',    name: 'Петропавловск-Камчатский',  type: 'port', country: 'RU', lat:  53.0121, lng: 158.6561 },
  { id: 'anadyr',           name: 'Анадырь',                   type: 'port', country: 'RU', lat:  64.7338, lng: 177.5215 },
  { id: 'vladivostok',      name: 'Владивосток',               type: 'hub',  country: 'RU', lat:  43.1155, lng: 131.8855 },
  { id: 'nakhodka',         name: 'Находка',                   type: 'port', country: 'RU', lat:  42.8206, lng: 132.8731 },
  { id: 'khabarovsk',       name: 'Хабаровск',                 type: 'city', country: 'RU', lat:  48.4827, lng: 135.0838 },

  // ── China ─────────────────────────────────────────────────────────────────
  // To add a Chinese city/port: append here with country: 'CN'
  { id: 'beijing',          name: 'Пекин',                     type: 'city', country: 'CN', lat:  39.9042, lng: 116.4074 },
  { id: 'dalian',           name: 'Далянь',                    type: 'port', country: 'CN', lat:  38.9140, lng: 121.6147 },
  { id: 'qingdao',          name: 'Циндао',                    type: 'port', country: 'CN', lat:  36.0671, lng: 120.3826 },
  { id: 'shanghai',         name: 'Шанхай',                    type: 'hub',  country: 'CN', lat:  31.2304, lng: 121.4737 },
  { id: 'guangzhou',        name: 'Гуанчжоу',                  type: 'port', country: 'CN', lat:  23.1291, lng: 113.2644 },

  // ── India ─────────────────────────────────────────────────────────────────
  // To add an Indian port: append here with country: 'IN'
  { id: 'mumbai',           name: 'Мумбаи',                    type: 'hub',  country: 'IN', lat:  19.0760, lng:  72.8777 },
  { id: 'kandla',           name: 'Кандла',                    type: 'port', country: 'IN', lat:  23.0000, lng:  70.2000 },
  { id: 'chennai',          name: 'Ченнаи',                    type: 'port', country: 'IN', lat:  13.0827, lng:  80.2707 },
  { id: 'kolkata',          name: 'Калькутта',                 type: 'port', country: 'IN', lat:  22.5726, lng:  88.3639 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Routes — sea & land polylines
// ─────────────────────────────────────────────────────────────────────────────


export const routes: MapRoute[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // SEA ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  // ── NSR: Северный морской путь ────────────────────────────────────────────
  // Full chain Мурманск → Архангельск → Сабетта → Дудинка → Тикси → Певек
  // → Провидения → Анадырь → Петропавловск-Камчатский → Магадан → Владивосток.
  // All waypoints stay in Arctic/Pacific open water:
  //   - White Sea approach to/from Архангельск uses the Gorlo strait (lat ~67N)
  //   - Сабетта approached from the Kara Sea (lat 72–73N) to avoid Yamal land
  //   - Дудинка reached via the Yenisei Gulf estuary
  //   - Провидения reached through the Gulf of Anadyr (Bering Sea)
  //   - Sea of Okhotsk + Tatar Strait used for Магадан → Владивосток leg
  {
    id: 'nsr-main',
    type: 'sea',
    fromNodeId: 'murmansk',
    toNodeId: 'vladivostok',
    label: 'Северный морской путь: Мурманск — Владивосток',
    priority: 'main',
    points: [
      { lat: 68.9585, lng:  33.0827 }, // Мурманск
      { lat: 72.00, lng:  36.00 }, // Баренцево море — к северу
      { lat: 71.00, lng:  40.52 }, // подход к Горлу Белого моря
      { lat: 67.00, lng:  38.50 }, // пролив Горло (Белое море — вход)
      { lat: 64.52, lng:  40.52 }, // Архангельск
      { lat: 67.00, lng:  39.00 }, // выход из Белого моря через Горло
      { lat: 70.50, lng:  41.00 }, // Баренцево море
      { lat: 73.50, lng:  48.00 }, // Баренцево море — севернее Колгуева
      { lat: 76.50, lng:  58.00 }, // севернее Новой Земли (открытая вода)
      { lat: 74.00, lng:  68.00 }, // Карское море — вход
      { lat: 72.50, lng:  71.50 }, // Карское море — подход к Ямалу с севера
      { lat: 71.27, lng:  72.07 }, // Сабетта
      { lat: 73.00, lng:  73.00 }, // Карское море — отход от Сабетты
      { lat: 74.50, lng:  80.00 }, // Карское море — к северо-востоку
      { lat: 73.50, lng:  84.00 }, // Енисейский залив (вход с Карского моря)
      { lat: 72.00, lng:  83.00 }, // Енисейский залив — к югу
      { lat: 71.00, lng:  82.50 }, // устье Енисея
      { lat: 69.40, lng:  86.17 }, // Дудинка
      { lat: 72.00, lng:  90.00 }, // Карское море — восточнее Таймыра
      { lat: 76.00, lng: 100.00 }, // севернее Таймыра
      { lat: 76.50, lng: 114.00 }, // море Лаптевых (запад)
      { lat: 74.00, lng: 126.00 }, // море Лаптевых
      { lat: 71.64, lng: 128.80 }, // Тикси
      { lat: 73.50, lng: 136.00 }, // Восточно-Сибирское море (запад)
      { lat: 74.50, lng: 150.00 }, // Восточно-Сибирское море (центр)
      { lat: 72.00, lng: 163.00 }, // Восточно-Сибирское море (восток)
      { lat: 69.70, lng: 170.27 }, // Певек
      { lat: 71.00, lng: 172.00 }, // Чукотское море — к северо-востоку
      { lat: 72.00, lng: 176.00 }, // Чукотское море — открытая вода
      { lat: 68.00, lng: 177.00 }, // Анадырский залив (северный вход)
      { lat: 65.50, lng: 175.50 }, // Анадырский залив
      { lat: 64.42, lng: 173.23 }, // Провидения
      { lat: 65.00, lng: 175.00 }, // Анадырский залив — к востоку
      { lat: 64.73, lng: 177.47 }, // Анадырь
      { lat: 62.00, lng: 175.00 }, // Берингово море
      { lat: 58.00, lng: 167.00 }, // Берингово море — юго-запад
      { lat: 53.01, lng: 158.66 }, // Петропавловск-Камчатский
      { lat: 56.00, lng: 153.00 }, // Охотское море (восток Камчатки)
      { lat: 57.50, lng: 151.50 }, // Охотское море — подход к Магадану
      { lat: 59.56, lng: 150.81 }, // Магадан
      { lat: 56.00, lng: 148.00 }, // Охотское море (центр)
      { lat: 52.50, lng: 143.00 }, // Охотское море — подход к Татарскому проливу
      { lat: 49.00, lng: 141.50 }, // Татарский пролив
      { lat: 46.00, lng: 135.50 }, // Японское море
      { lat: 43.12, lng: 131.89 }, // Владивосток
    ],
  },

  // ── Северный завоз — Западная Арктика (вторичный) ────────────────────────
  // Secondary supply route: Мурманск → Архангельск → Сабетта → Дудинка.
  // Covers the Barents and Kara Sea western Arctic supply corridor independently
  // of the full NSR chain.
  {
    id: 'arctic-supply',
    type: 'sea',
    fromNodeId: 'murmansk',
    toNodeId: 'dudinka',
    label: 'Северный завоз — Западная Арктика: Мурманск — Сабетта — Дудинка',
    priority: 'secondary',
    points: [
      { lat: 68.9585, lng:  33.0827 }, // Мурманск
      { lat: 72.00, lng:  36.00 }, // Баренцево море
      { lat: 67.00, lng:  38.50 }, // пролив Горло
      { lat: 64.52, lng:  40.52 }, // Архангельск
      { lat: 67.00, lng:  39.00 }, // выход из Белого моря
      { lat: 73.00, lng:  47.00 }, // Баренцево море — к востоку
      { lat: 76.00, lng:  57.00 }, // севернее Новой Земли
      { lat: 74.00, lng:  68.00 }, // Карское море — вход
      { lat: 72.50, lng:  71.50 }, // Карское море — подход к Ямалу
      { lat: 71.27, lng:  72.07 }, // Сабетта
      { lat: 73.00, lng:  73.00 }, // Карское море — отход
      { lat: 74.00, lng:  80.00 }, // Карское море — к северо-востоку
      { lat: 73.50, lng:  84.00 }, // Енисейский залив (вход)
      { lat: 72.00, lng:  83.00 }, // Енисейский залив
      { lat: 69.40, lng:  86.17 }, // Дудинка
    ],
  },

  // ── Балтийский морской маршрут ────────────────────────────────────────────
  // Stays in the Gulf of Finland and open Baltic — no land crossing.
  // Intermediate points placed north/south of the direct line to stay in water.
  {
    id: 'baltic',
    type: 'sea',
    fromNodeId: 'saint-petersburg',
    toNodeId: 'kaliningrad',
    label: 'Балтийский морской маршрут: Санкт-Петербург — Калининград',
    priority: 'secondary',
    points: [
      { lat: 59.93, lng: 30.34 }, // Санкт-Петербург
      { lat: 60.00, lng: 27.00 }, // Финский залив — близ Таллина
      { lat: 59.50, lng: 24.00 }, // выход из Финского залива
      { lat: 57.50, lng: 21.00 }, // открытая Балтика
      { lat: 55.50, lng: 19.50 }, // южная Балтика
      { lat: 54.71, lng: 20.51 }, // Калининград
    ],
  },

  // ── Россия — Китай (Тихоокеанский): Владивосток — Шанхай ─────────────────
  // Japan Sea → Korea Strait → Yellow Sea → East China Sea → Shanghai.
  {
    id: 'ru-cn-sea',
    type: 'sea',
    fromNodeId: 'vladivostok',
    toNodeId: 'shanghai',
    label: 'Россия — Китай: Владивосток — Шанхай',
    priority: 'main',
    points: [
      { lat: 43.12, lng: 131.89 }, // Владивосток
      { lat: 40.00, lng: 132.50 }, // Японское море — на юг
      { lat: 37.00, lng: 131.00 }, // Японское море — подход к Корейскому проливу
      { lat: 34.50, lng: 129.50 }, // Корейский пролив
      { lat: 38.91, lng: 121.61 }, // Далянь (Жёлтое море)
      { lat: 36.07, lng: 120.38 }, // Циндао
      { lat: 33.00, lng: 122.00 }, // Жёлтое море (юг)
      { lat: 31.23, lng: 121.47 }, // Шанхай
    ],
  },

  // ── Находка — Гуанчжоу (Южно-Китайское море) ─────────────────────────────
  // Japan Sea → Korea Strait → East China Sea → Taiwan Strait → SCS.
  {
    id: 'ru-cn-south',
    type: 'sea',
    fromNodeId: 'nakhodka',
    toNodeId: 'guangzhou',
    label: 'Находка — Гуанчжоу (Южно-Китайское море)',
    priority: 'secondary',
    points: [
      { lat: 42.82, lng: 132.87 }, // Находка
      { lat: 38.00, lng: 130.00 }, // Японское море
      { lat: 34.00, lng: 129.50 }, // Корейский пролив
      { lat: 29.00, lng: 122.50 }, // Восточно-Китайское море
      { lat: 24.00, lng: 118.00 }, // Тайваньский пролив
      { lat: 21.00, lng: 115.00 }, // Южно-Китайское море (север)
      { lat: 23.13, lng: 113.26 }, // Гуанчжоу
    ],
  },

  // ── Россия — Индия: Новороссийск — Мумбаи (через Суэц) ───────────────────
  // Чёрное море → Босфор → Средиземноморье → Суэцкий канал →
  // Красное море → Аравийское море → Мумбаи.
  // Every waypoint stays in open water; no land crossing.
  {
    id: 'ru-india-sea',
    type: 'sea',
    fromNodeId: 'novorossiysk',
    toNodeId: 'mumbai',
    label: 'Россия — Индия: Новороссийск — Мумбаи (через Суэц)',
    priority: 'main',
    points: [
      { lat: 44.72, lng:  37.77 }, // Новороссийск
      { lat: 43.00, lng:  34.00 }, // Чёрное море — на запад
      { lat: 41.80, lng:  31.50 }, // западное Чёрное море (подход к Босфору)
      { lat: 41.20, lng:  29.00 }, // вход в Босфор (Чёрноморская сторона)
      { lat: 40.70, lng:  26.50 }, // Мраморное море / выход из Дарданелл
      { lat: 38.50, lng:  25.00 }, // Эгейское море
      { lat: 35.00, lng:  26.50 }, // ЮВ Эгейское / В. Средиземноморье
      { lat: 34.20, lng:  30.50 }, // Средиземноморье — южнее Кипра
      { lat: 30.50, lng:  32.50 }, // Суэцкий канал (Порт-Саид)
      { lat: 27.50, lng:  34.00 }, // Красное море (середина)
      { lat: 12.50, lng:  43.50 }, // Баб-эль-Мандеб / Аденский залив
      { lat: 12.00, lng:  52.00 }, // Аравийское море (запад — южнее Йемена)
      { lat: 15.00, lng:  61.00 }, // Аравийское море (юг Омана)
      { lat: 19.08, lng:  72.88 }, // Мумбаи
    ],
  },

  // ── Индия — Китай (Малаккский пролив) ────────────────────────────────────
  // Mumbai → Cape Comorin → Bay of Bengal → Andaman Sea →
  // Malacca Strait → South China Sea → Shanghai.
  {
    id: 'india-china-sea',
    type: 'sea',
    fromNodeId: 'mumbai',
    toNodeId: 'shanghai',
    label: 'Индия — Китай: Мумбаи — Шанхай (через Малаккский пролив)',
    priority: 'secondary',
    points: [
      { lat: 19.08, lng:  72.88 }, // Мумбаи
      { lat: 14.00, lng:  74.50 }, // Аравийское море (вост. побережье Индии)
      { lat:  8.00, lng:  77.50 }, // мыс Коморин (южная оконечность Индии)
      { lat:  7.00, lng:  80.00 }, // южнее Шри-Ланки
      { lat: 13.08, lng:  80.27 }, // Ченнаи (Бенгальский залив)
      { lat: 10.00, lng:  85.00 }, // Бенгальский залив
      { lat:  8.00, lng:  97.50 }, // Андаманское море
      { lat:  4.00, lng: 100.50 }, // Малаккский пролив (южный вход)
      { lat:  9.00, lng: 108.00 }, // Южно-Китайское море (запад)
      { lat: 16.50, lng: 112.00 }, // Южно-Китайское море (центр)
      { lat: 20.50, lng: 114.50 }, // Южно-Китайское море (север — у Гонконга)
      { lat: 24.00, lng: 118.00 }, // Тайваньский пролив
      { lat: 27.50, lng: 121.00 }, // Восточно-Китайское море
      { lat: 31.23, lng: 121.47 }, // Шанхай
    ],
  },

  // ── Черноморский каботажный маршрут ──────────────────────────────────────
  // Arc stays south of Crimea through open Black Sea water.
  {
    id: 'black-sea',
    type: 'sea',
    fromNodeId: 'novorossiysk',
    toNodeId: 'sevastopol',
    label: 'Черноморский маршрут: Новороссийск — Севастополь',
    priority: 'secondary',
    points: [
      { lat: 44.72, lng: 37.77 }, // Новороссийск
      { lat: 43.50, lng: 35.50 }, // Чёрное море — ЮВ Крыма
      { lat: 43.20, lng: 33.00 }, // Чёрное море — южнее Крыма
      { lat: 44.62, lng: 33.53 }, // Севастополь
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LAND ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  // ── Главный сухопутный коридор: Транссибирская магистраль ────────────────
  // Vladivostok → Trans-Siberian Railway → Moscow → Saint-Petersburg.
  // Points follow the TSR alignment; intermediate waypoints added for
  // cities without dedicated nodes to give realistic curve to the polyline.
  {
    id: 'trans-sib',
    type: 'land',
    fromNodeId: 'vladivostok',
    toNodeId: 'saint-petersburg',
    label: 'Главный сухопутный коридор: Владивосток — Москва — Санкт-Петербург',
    priority: 'main',
    points: [
      { lat: 43.12, lng: 131.89 }, // Владивосток
      { lat: 48.48, lng: 135.08 }, // Хабаровск
      { lat: 50.28, lng: 127.54 }, // Благовещенск
      { lat: 52.03, lng: 113.50 }, // Чита
      { lat: 52.30, lng: 104.30 }, // Иркутск
      { lat: 56.02, lng:  92.89 }, // Красноярск
      { lat: 54.99, lng:  82.94 }, // Новосибирск
      { lat: 55.00, lng:  73.37 }, // Омск
      { lat: 56.84, lng:  60.61 }, // Екатеринбург
      { lat: 58.01, lng:  56.25 }, // Пермь
      { lat: 55.79, lng:  49.12 }, // Казань
      { lat: 56.33, lng:  44.01 }, // Нижний Новгород
      { lat: 55.76, lng:  37.62 }, // Москва
      { lat: 56.85, lng:  35.92 }, // Тверь
      { lat: 59.93, lng:  30.34 }, // Санкт-Петербург
    ],
  },

  // ── Северный завоз — Якутия: Хабаровск → Якутск → Магадан ───────────────
  // Follows the Lena Highway (R504) and Kolyma Highway alignment roughly.
  // Schematic but directionally correct (no water segments).
  {
    id: 'north-yakutsk',
    type: 'land',
    fromNodeId: 'khabarovsk',
    toNodeId: 'magadan',
    label: 'Северный завоз — Якутия: Хабаровск — Якутск — Магадан',
    priority: 'secondary',
    points: [
      { lat: 48.48, lng: 135.08 }, // Хабаровск
      { lat: 52.50, lng: 134.50 }, // верховья Буреи
      { lat: 57.00, lng: 133.00 }, // Алдан (Якутия)
      { lat: 62.04, lng: 129.73 }, // Якутск
      { lat: 63.50, lng: 135.00 }, // пост-Якутск → восток
      { lat: 62.50, lng: 141.00 }, // Алданское нагорье
      { lat: 62.00, lng: 149.00 }, // трасса Колыма
      { lat: 59.56, lng: 150.81 }, // Магадан
    ],
  },

  // ── Южный транспортный коридор: Москва — Новороссийск ───────────────────
  // M4 Don highway corridor through central Russia and the North Caucasus.
  {
    id: 'south-corridor',
    type: 'land',
    fromNodeId: 'moscow',
    toNodeId: 'novorossiysk',
    label: 'Южный транспортный коридор: Москва — Новороссийск',
    priority: 'secondary',
    points: [
      { lat: 55.76, lng: 37.62 }, // Москва
      { lat: 53.20, lng: 40.00 }, // Тамбов
      { lat: 51.68, lng: 39.21 }, // Воронеж
      { lat: 48.71, lng: 44.51 }, // Волгоград
      { lat: 47.24, lng: 39.70 }, // Ростов-на-Дону
      { lat: 44.72, lng: 37.77 }, // Новороссийск
    ],
  },

  // ── Россия — Китай (суша): Владивосток — Пекин ───────────────────────────
  // Via Khabarovsk → Chita → Zabaykalsk border crossing (Manzhouli) →
  // Harbin → Shenyang → Beijing.  Trans-Manchurian Railway corridor.
  {
    id: 'ru-cn-land',
    type: 'land',
    fromNodeId: 'vladivostok',
    toNodeId: 'beijing',
    label: 'Россия — Китай (суша): Владивосток — Пекин',
    priority: 'secondary',
    points: [
      { lat: 43.12, lng: 131.89 }, // Владивосток
      { lat: 48.48, lng: 135.08 }, // Хабаровск
      { lat: 52.03, lng: 113.50 }, // Чита
      { lat: 49.65, lng: 117.33 }, // Забайкальск (погранпереход, Россия)
      { lat: 49.60, lng: 117.47 }, // Маньчжурия (Китай)
      { lat: 47.64, lng: 122.07 }, // Хайлар
      { lat: 45.75, lng: 126.65 }, // Харбин
      { lat: 41.83, lng: 123.43 }, // Шэньян
      { lat: 39.90, lng: 116.41 }, // Пекин
    ],
  },

  // ── Москва — Мурманск (федеральная трасса M18/Кола) ──────────────────────
  {
    id: 'moscow-murmansk',
    type: 'land',
    fromNodeId: 'moscow',
    toNodeId: 'murmansk',
    label: 'Москва — Мурманск (трасса «Кола»)',
    priority: 'secondary',
    points: [
      { lat: 55.76, lng: 37.62 }, // Москва
      { lat: 58.52, lng: 31.27 }, // Великий Новгород
      { lat: 59.93, lng: 30.34 }, // Санкт-Петербург
      { lat: 61.79, lng: 30.93 }, // Карелия (Выборг / Приозерск)
      { lat: 64.90, lng: 30.89 }, // Костомукша (северная Карелия)
      { lat: 68.9585, lng: 33.0827 }, // Мурманск
    ],
  },

  // ── Урал → Арктика: Екатеринбург — Дудинка ───────────────────────────────
  // Northern supply corridor: Tyumen → Surgut → Novy Urengoy → Dudinka.
  // Final stretch to Dudinka follows the Yenisei corridor (land/river approach).
  {
    id: 'ural-arctic',
    type: 'land',
    fromNodeId: 'yekaterinburg',
    toNodeId: 'dudinka',
    label: 'Урал → Арктика: Екатеринбург — Дудинка (Северный завоз)',
    priority: 'secondary',
    points: [
      { lat: 56.84, lng:  60.61 }, // Екатеринбург
      { lat: 57.15, lng:  65.53 }, // Тюмень
      { lat: 61.25, lng:  73.38 }, // Сургут
      { lat: 64.60, lng:  76.60 }, // Новый Уренгой
      { lat: 67.50, lng:  80.00 }, // Ямбург — подход к Дудинке
      { lat: 69.40, lng:  86.17 }, // Дудинка
    ],
  },

  // ── Россия — Индия (мультимодальный коридор INSTC) ───────────────────────
  // International North–South Transport Corridor (schematic):
  // Новороссийск → Астрахань → Баку → Тегеран → Бандар-Аббас →
  // Аравийское море → Мумбаи.
  // Marked type: 'land' to represent the primary overland segment.
  // The Caspian and final Arabian Sea legs are schematic.
  {
    id: 'ru-india-multimodal',
    type: 'land',
    fromNodeId: 'novorossiysk',
    toNodeId: 'mumbai',
    label: 'Россия — Индия: Новороссийск — Мумбаи (мультимодальный коридор INSTC)',
    priority: 'secondary',
    points: [
      { lat: 44.72, lng:  37.77 }, // Новороссийск
      { lat: 44.00, lng:  43.00 }, // Краснодарский край / Ставрополье
      { lat: 46.35, lng:  48.03 }, // Астрахань (Каспийское море)
      { lat: 41.50, lng:  50.00 }, // Баку (Азербайджан)
      { lat: 38.00, lng:  48.50 }, // Тебриз (Иран)
      { lat: 35.70, lng:  51.40 }, // Тегеран
      { lat: 32.00, lng:  54.00 }, // Центральный Иран
      { lat: 27.10, lng:  56.40 }, // Бандар-Аббас (Персидский залив)
      { lat: 24.00, lng:  60.50 }, // Аравийское море (выход из Оманского залива)
      { lat: 22.00, lng:  65.00 }, // Аравийское море
      { lat: 19.08, lng:  72.88 }, // Мумбаи
    ],
  },

  // ── Сибирь — Северный завоз: Новосибирск — Якутск ───────────────────────
  // Follows the approximate Bratsk → Ust-Kut → Lena Highway corridor (M56/R504).
  {
    id: 'siberian-north',
    type: 'land',
    fromNodeId: 'novosibirsk',
    toNodeId: 'yakutsk',
    label: 'Сибирь — Северный завоз: Новосибирск — Якутск',
    priority: 'secondary',
    points: [
      { lat: 54.99, lng:  82.94 }, // Новосибирск
      { lat: 56.02, lng:  92.89 }, // Красноярск
      { lat: 56.30, lng: 101.70 }, // Братск
      { lat: 57.84, lng: 107.10 }, // Усть-Кут (р. Лена)
      { lat: 60.40, lng: 116.50 }, // Ленск
      { lat: 62.04, lng: 129.73 }, // Якутск
    ],
  },
];
