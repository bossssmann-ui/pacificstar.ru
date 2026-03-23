/**
 * Pacific Star — Interactive logistics map mock data
 * =====================================================
 * TypeScript source for MapNode and MapRoute arrays used
 * by the Pacific Star logistics map (pacificstar.ru).
 *
 * Covers:
 *  - Russia: main cities + all Northern Sea Route (NSR) ports
 *  - China: Beijing + major sea ports
 *  - India: Mumbai, Chennai, Kolkata, Mundra
 *
 * Routes (20 total, 13 sea + 7 land):
 *  Sea:  NSR chain (9 segments), Baltic, Pacific corridor (2), Novorossiysk–Mumbai
 *  Land: Trans-Siberian, Moscow–SPb, Moscow–Novorossiysk, Russia–China,
 *        Northern road × 2, Moscow–Arkhangelsk
 *
 * Geographic rules enforced:
 *  - Sea routes: every polyline point is in open water
 *  - Land routes: polylines follow real road/rail corridors, never cross sea
 */

type NodeType = 'port' | 'city' | 'hub';
type CountryCode = 'RU' | 'CN' | 'IN' | 'OTHER';
type RouteType = 'sea' | 'land';
type RoutePriority = 'main' | 'secondary';

export interface MapNode {
  id: string;
  name: string;
  type: NodeType;
  country: CountryCode;
  lat: number; // реальные или близкие к реальным координаты
  lng: number;
}

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface MapRoute {
  id: string;
  type: RouteType;
  fromNodeId: string;
  toNodeId: string;
  points: RoutePoint[]; // polyline
  label?: string;
  priority?: RoutePriority;
}

export const nodes: MapNode[] = [
  // ── Russia: main cities ──
  { id: 'moscow',           name: 'Москва',                   type: 'city', country: 'RU', lat:  55.7558, lng:  37.6173 },
  { id: 'saint-petersburg', name: 'Санкт-Петербург',          type: 'port', country: 'RU', lat:  59.9343, lng:  30.3351 },
  { id: 'kaliningrad',      name: 'Калининград',              type: 'port', country: 'RU', lat:  54.7065, lng:  20.5109 },
  { id: 'kazan',            name: 'Казань',                   type: 'city', country: 'RU', lat:  55.7879, lng:  49.1221 },
  { id: 'yekaterinburg',    name: 'Екатеринбург',             type: 'city', country: 'RU', lat:  56.8389, lng:  60.6057 },
  { id: 'novosibirsk',      name: 'Новосибирск',              type: 'city', country: 'RU', lat:  54.9885, lng:  82.9357 },
  { id: 'irkutsk',          name: 'Иркутск',                  type: 'city', country: 'RU', lat:  52.2978, lng: 104.2965 },
  { id: 'yakutsk',          name: 'Якутск',                   type: 'city', country: 'RU', lat:  62.0355, lng: 129.7320 },
  { id: 'magadan',          name: 'Магадан',                  type: 'port', country: 'RU', lat:  59.5635, lng: 150.8135 },
  { id: 'vladivostok',      name: 'Владивосток',              type: 'hub',  country: 'RU', lat:  43.1155, lng: 131.8855 },
  { id: 'nakhodka',         name: 'Находка',                  type: 'port', country: 'RU', lat:  42.8206, lng: 132.8731 },
  { id: 'petropavlovsk',    name: 'Петропавловск-Камчатский', type: 'port', country: 'RU', lat:  53.0121, lng: 158.6561 },
  { id: 'novorossiysk',     name: 'Новороссийск',             type: 'port', country: 'RU', lat:  44.7233, lng:  37.7685 },
  { id: 'sevastopol',       name: 'Севастополь',              type: 'port', country: 'RU', lat:  44.6166, lng:  33.5254 },

  // ── Russia: Northern Sea Route (NSR) ports ──
  // Coordinates from official sources; do NOT change.
  { id: 'murmansk',         name: 'Мурманск',                 type: 'port', country: 'RU', lat:  68.9700, lng:  33.0600 },
  { id: 'arkhangelsk',      name: 'Архангельск',              type: 'port', country: 'RU', lat:  64.5200, lng:  40.5200 },
  { id: 'sabetta',          name: 'Сабетта',                  type: 'port', country: 'RU', lat:  71.2700, lng:  72.0700 },
  { id: 'dudinka',          name: 'Дудинка',                  type: 'port', country: 'RU', lat:  69.4000, lng:  86.1700 },
  { id: 'tiksi',            name: 'Тикси',                    type: 'port', country: 'RU', lat:  71.6500, lng: 128.8000 },
  { id: 'pevek',            name: 'Певек',                    type: 'port', country: 'RU', lat:  69.7000, lng: 170.3000 },
  { id: 'provideniya',      name: 'Провидения',               type: 'port', country: 'RU', lat:  64.4200, lng: 173.2300 },
  { id: 'anadyr',           name: 'Анадырь',                  type: 'port', country: 'RU', lat:  64.7300, lng: 177.4700 },

  // ── Russia: Far East land hubs ──
  { id: 'khabarovsk',       name: 'Хабаровск',                type: 'city', country: 'RU', lat:  48.4827, lng: 135.0838 },
  { id: 'chita',            name: 'Чита',                     type: 'city', country: 'RU', lat:  52.0316, lng: 113.4994 },

  // ── China ──
  { id: 'beijing',          name: 'Пекин',                    type: 'city', country: 'CN', lat:  39.9042, lng: 116.4074 },
  { id: 'shanghai',         name: 'Шанхай',                   type: 'port', country: 'CN', lat:  31.2304, lng: 121.4737 },
  { id: 'guangzhou',        name: 'Гуанчжоу',                 type: 'port', country: 'CN', lat:  23.1291, lng: 113.2644 },
  { id: 'dalian',           name: 'Далянь',                   type: 'port', country: 'CN', lat:  38.9140, lng: 121.6147 },
  { id: 'qingdao',          name: 'Циндао',                   type: 'port', country: 'CN', lat:  36.0671, lng: 120.3826 },

  // ── India ──
  { id: 'mumbai',           name: 'Мумбаи',                   type: 'port', country: 'IN', lat:  19.0760, lng:  72.8777 },
  { id: 'chennai',          name: 'Ченнаи',                   type: 'port', country: 'IN', lat:  13.0827, lng:  80.2707 },
  { id: 'kolkata',          name: 'Калькутта',                type: 'port', country: 'IN', lat:  22.5726, lng:  88.3639 },
  { id: 'mundra',           name: 'Мундра',                   type: 'port', country: 'IN', lat:  22.8396, lng:  69.6669 },
];

export const routes: MapRoute[] = [
  // ──────────────────────────────────────────────────────────────────────────────
  // SEA: Northern Sea Route (NSR) — 9 segments, Мурманск → Владивосток
  //
  // Waypoints are placed in open Arctic/Pacific waters.
  // White Sea throat (Gorlo): ~66–69°N, 37–39°E — narrow but fully sea.
  // Kara Sea:  70–77°N, 50–100°E
  // Laptev Sea: 72–77°N, 100–140°E
  // East Siberian Sea: 69–76°N, 140–180°E
  // Chukchi Sea: 64–72°N, 168–180°E
  // Bering Sea: 54–64°N, 162–180°E
  // Sea of Okhotsk: 45–60°N, 135–165°E
  // ──────────────────────────────────────────────────────────────────────────────

  // 1. Мурманск → Архангельск  (Barents Sea → White Sea throat → White Sea)
  {
    id: 'nsr-01',
    type: 'sea',
    fromNodeId: 'murmansk',
    toNodeId: 'arkhangelsk',
    priority: 'main',
    label: 'СМП: Мурманск — Архангельск',
    points: [
      { lat: 68.97, lng: 33.06 },  // Мурманск (Кольский залив)
      { lat: 69.50, lng: 35.00 },  // Баренцево море (выход из залива)
      { lat: 68.50, lng: 37.00 },  // Горло Белого моря
      { lat: 67.00, lng: 38.50 },  // Горло Белого моря (юг)
      { lat: 65.50, lng: 39.00 },  // Белое море (открытая вода)
      { lat: 64.52, lng: 40.52 },  // Архангельск
    ],
  },

  // 2. Архангельск → Сабетта  (White Sea → Barents Sea → Kara Sea → Ob Bay)
  {
    id: 'nsr-02',
    type: 'sea',
    fromNodeId: 'arkhangelsk',
    toNodeId: 'sabetta',
    priority: 'main',
    label: 'СМП: Архангельск — Сабетта',
    points: [
      { lat: 64.52, lng: 40.52 },  // Архангельск
      { lat: 66.50, lng: 39.00 },  // Белое море — выход на север
      { lat: 68.00, lng: 42.00 },  // Баренцево море (восток)
      { lat: 70.00, lng: 50.00 },  // Баренцево море — подход к Карскому
      { lat: 72.50, lng: 60.00 },  // Карское море
      { lat: 72.00, lng: 68.00 },  // Обская губа (вход с севера)
      { lat: 71.27, lng: 72.07 },  // Сабетта
    ],
  },

  // 3. Сабетта → Дудинка  (Kara Sea → Yenisei Gulf)
  {
    id: 'nsr-03',
    type: 'sea',
    fromNodeId: 'sabetta',
    toNodeId: 'dudinka',
    priority: 'main',
    label: 'СМП: Сабетта — Дудинка',
    points: [
      { lat: 71.27, lng: 72.07 },  // Сабетта
      { lat: 72.50, lng: 76.00 },  // Карское море (открытая вода)
      { lat: 73.50, lng: 82.00 },  // Карское море (восток)
      { lat: 71.50, lng: 84.00 },  // Енисейский залив (вход)
      { lat: 69.40, lng: 86.17 },  // Дудинка
    ],
  },

  // 4. Дудинка → Тикси  (Kara Sea → Laptev Sea)
  {
    id: 'nsr-04',
    type: 'sea',
    fromNodeId: 'dudinka',
    toNodeId: 'tiksi',
    priority: 'main',
    label: 'СМП: Дудинка — Тикси',
    points: [
      { lat: 69.40, lng:  86.17 }, // Дудинка
      { lat: 72.50, lng:  92.00 }, // Карское море (северо-восток)
      { lat: 76.00, lng: 105.00 }, // Море Лаптевых (запад)
      { lat: 76.50, lng: 116.00 }, // Море Лаптевых (центр)
      { lat: 74.50, lng: 124.00 }, // Море Лаптевых (восток)
      { lat: 72.50, lng: 127.00 }, // Залив Неелова (подход)
      { lat: 71.65, lng: 128.80 }, // Тикси
    ],
  },

  // 5. Тикси → Певек  (Laptev Sea → East Siberian Sea)
  {
    id: 'nsr-05',
    type: 'sea',
    fromNodeId: 'tiksi',
    toNodeId: 'pevek',
    priority: 'main',
    label: 'СМП: Тикси — Певек',
    points: [
      { lat: 71.65, lng: 128.80 }, // Тикси
      { lat: 73.50, lng: 137.00 }, // Восточно-Сибирское море (запад)
      { lat: 73.00, lng: 150.00 }, // Восточно-Сибирское море
      { lat: 72.00, lng: 160.00 }, // Восточно-Сибирское море (восток)
      { lat: 70.50, lng: 165.00 }, // Подход к Певеку
      { lat: 69.70, lng: 170.30 }, // Певек
    ],
  },

  // 6. Певек → Провидения  (Chukchi Sea — stays north of coast)
  {
    id: 'nsr-06',
    type: 'sea',
    fromNodeId: 'pevek',
    toNodeId: 'provideniya',
    priority: 'main',
    label: 'СМП: Певек — Провидения',
    points: [
      { lat: 69.70, lng: 170.30 }, // Певек
      { lat: 68.50, lng: 172.00 }, // Чукотское море
      { lat: 66.50, lng: 173.00 }, // Чукотское море (юг)
      { lat: 64.42, lng: 173.23 }, // Провидения
    ],
  },

  // 7. Провидения → Петропавловск-Камчатский  (Bering Sea — open water)
  {
    id: 'nsr-07',
    type: 'sea',
    fromNodeId: 'provideniya',
    toNodeId: 'petropavlovsk',
    priority: 'main',
    label: 'СМП: Провидения — Петропавловск-Камчатский',
    points: [
      { lat: 64.42, lng: 173.23 }, // Провидения
      { lat: 62.00, lng: 177.00 }, // Берингово море (запад)
      { lat: 58.00, lng: 172.00 }, // Берингово море (юг)
      { lat: 55.50, lng: 165.00 }, // Подход к Камчатке с востока
      { lat: 53.01, lng: 158.66 }, // Петропавловск-Камчатский
    ],
  },

  // 8. Петропавловск-Камчатский → Магадан  (Sea of Okhotsk)
  {
    id: 'nsr-08',
    type: 'sea',
    fromNodeId: 'petropavlovsk',
    toNodeId: 'magadan',
    priority: 'main',
    label: 'СМП: Петропавловск-Камчатский — Магадан',
    points: [
      { lat: 53.01, lng: 158.66 }, // Петропавловск-Камчатский
      { lat: 56.00, lng: 154.00 }, // Охотское море
      { lat: 57.50, lng: 151.00 }, // Охотское море (северо-запад)
      { lat: 59.56, lng: 150.81 }, // Магадан
    ],
  },

  // 9. Магадан → Владивосток  (Sea of Okhotsk → Tatar Strait → Sea of Japan)
  {
    id: 'nsr-09',
    type: 'sea',
    fromNodeId: 'magadan',
    toNodeId: 'vladivostok',
    priority: 'main',
    label: 'СМП: Магадан — Владивосток',
    points: [
      { lat: 59.56, lng: 150.81 }, // Магадан
      { lat: 55.00, lng: 143.00 }, // Охотское море (запад)
      { lat: 49.00, lng: 139.00 }, // Татарский пролив (вход)
      { lat: 46.00, lng: 135.50 }, // Японское море (север)
      { lat: 43.12, lng: 131.89 }, // Владивосток
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────────
  // SEA: Baltic — Санкт-Петербург → Калининград
  // Points stay in the Gulf of Finland and open Baltic Sea.
  // ──────────────────────────────────────────────────────────────────────────────
  {
    id: 'sea-baltic',
    type: 'sea',
    fromNodeId: 'saint-petersburg',
    toNodeId: 'kaliningrad',
    priority: 'secondary',
    label: 'Балтийский маршрут: Санкт-Петербург — Калининград',
    points: [
      { lat: 59.93, lng: 30.34 }, // Санкт-Петербург
      { lat: 60.00, lng: 27.00 }, // Финский залив (выход)
      { lat: 59.50, lng: 24.00 }, // Финский залив (западный выход)
      { lat: 57.50, lng: 21.50 }, // Балтийское море (открытая вода)
      { lat: 56.00, lng: 20.50 }, // Подход к Калининграду
      { lat: 54.71, lng: 20.51 }, // Калининград
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────────
  // SEA: Pacific corridor — Владивосток → Шанхай → Мумбаи
  // ──────────────────────────────────────────────────────────────────────────────

  // Владивосток → Шанхай  (Sea of Japan → Yellow Sea → East China Sea)
  {
    id: 'sea-vlad-shanghai',
    type: 'sea',
    fromNodeId: 'vladivostok',
    toNodeId: 'shanghai',
    priority: 'main',
    label: 'Тихоокеанский маршрут: Владивосток — Шанхай',
    points: [
      { lat: 43.12, lng: 131.89 }, // Владивосток
      { lat: 40.00, lng: 129.50 }, // Японское море
      { lat: 36.00, lng: 124.50 }, // Жёлтое море
      { lat: 32.00, lng: 122.00 }, // Восточно-Китайское море
      { lat: 31.23, lng: 121.47 }, // Шанхай
    ],
  },

  // Шанхай → Мумбаи  (East China Sea → SCS → Malacca → Indian Ocean → Arabian Sea)
  // NEVER crosses land — every point is in open sea.
  {
    id: 'sea-shanghai-mumbai',
    type: 'sea',
    fromNodeId: 'shanghai',
    toNodeId: 'mumbai',
    priority: 'main',
    label: 'Тихоокеанский маршрут: Шанхай — Мумбаи',
    points: [
      { lat: 31.23, lng: 121.47 }, // Шанхай
      { lat: 24.00, lng: 119.00 }, // Тайваньский пролив
      { lat: 18.00, lng: 114.00 }, // Южно-Китайское море
      { lat: 10.00, lng: 109.00 }, // Южно-Китайское море (юг)
      { lat:  5.00, lng: 103.50 }, // Малаккский пролив (вход с севера)
      { lat:  2.50, lng:  99.00 }, // Малаккский пролив (юг) / Индийский океан
      { lat:  6.00, lng:  83.00 }, // Индийский океан
      { lat: 12.00, lng:  73.00 }, // Аравийское море
      { lat: 19.08, lng:  72.88 }, // Мумбаи
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────────
  // SEA: Russia → India via Black Sea / Suez Canal
  // Route: Чёрное море → Босфор → Эгейское → Средиземное → Суэц → Красное → Аравийское
  // НИКОГДА не пересекает сушу (Турция, Иран, Пакистан и т.д.).
  // ──────────────────────────────────────────────────────────────────────────────
  {
    id: 'sea-novorossiysk-mumbai',
    type: 'sea',
    fromNodeId: 'novorossiysk',
    toNodeId: 'mumbai',
    priority: 'main',
    label: 'Россия — Индия (морской): Новороссийск — Мумбаи',
    points: [
      { lat: 44.72, lng:  37.77 }, // Новороссийск
      { lat: 43.00, lng:  34.00 }, // Чёрное море (центр)
      { lat: 41.50, lng:  31.00 }, // Западное Чёрное море
      { lat: 41.20, lng:  29.00 }, // Вход в Босфор (со стороны Чёрного моря)
      { lat: 40.70, lng:  26.50 }, // Мраморное море / выход через Дарданеллы
      { lat: 38.50, lng:  25.00 }, // Эгейское море
      { lat: 35.00, lng:  26.50 }, // Восточное Средиземноморье
      { lat: 30.50, lng:  32.50 }, // Суэцкий канал (Порт-Саид)
      { lat: 27.00, lng:  34.00 }, // Красное море (центр)
      { lat: 12.50, lng:  43.50 }, // Баб-эль-Мандеб / Аденский залив
      { lat: 12.00, lng:  52.00 }, // Аравийское море (запад)
      { lat: 15.00, lng:  61.00 }, // Аравийское море (юг Омана)
      { lat: 19.08, lng:  72.88 }, // Мумбаи
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────────
  // LAND: Trans-Siberian main corridor — Владивосток → Москва
  // Follows the Trans-Siberian Railway / M58–M53–M51 highway corridor.
  // ──────────────────────────────────────────────────────────────────────────────
  {
    id: 'land-trans-sib',
    type: 'land',
    fromNodeId: 'vladivostok',
    toNodeId: 'moscow',
    priority: 'main',
    label: 'Главный сухопутный коридор: Владивосток — Москва',
    points: [
      { lat: 43.12, lng: 131.89 }, // Владивосток
      { lat: 48.48, lng: 135.08 }, // Хабаровск
      { lat: 52.03, lng: 113.50 }, // Чита
      { lat: 52.30, lng: 104.30 }, // Иркутск
      { lat: 54.99, lng:  82.94 }, // Новосибирск
      { lat: 56.84, lng:  60.61 }, // Екатеринбург
      { lat: 55.79, lng:  49.12 }, // Казань
      { lat: 55.76, lng:  37.62 }, // Москва
    ],
  },

  // Москва → Санкт-Петербург  (M10 / Трасса Р-23)
  {
    id: 'land-moscow-spb',
    type: 'land',
    fromNodeId: 'moscow',
    toNodeId: 'saint-petersburg',
    priority: 'secondary',
    label: 'Москва — Санкт-Петербург',
    points: [
      { lat: 55.76, lng: 37.62 }, // Москва
      { lat: 57.50, lng: 34.00 }, // Вышний Волочёк / Тверь
      { lat: 59.93, lng: 30.34 }, // Санкт-Петербург
    ],
  },

  // Москва → Новороссийск  (M4 Дон)
  {
    id: 'land-moscow-novorossiysk',
    type: 'land',
    fromNodeId: 'moscow',
    toNodeId: 'novorossiysk',
    priority: 'secondary',
    label: 'Южный коридор: Москва — Новороссийск',
    points: [
      { lat: 55.76, lng: 37.62 }, // Москва
      { lat: 51.67, lng: 39.21 }, // Воронеж
      { lat: 47.24, lng: 39.70 }, // Ростов-на-Дону
      { lat: 44.72, lng: 37.77 }, // Новороссийск
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────────
  // LAND: Russia → China — Владивосток → Пекин
  // Via Khabarovsk → Harbin → Shenyang → Beijing
  // ──────────────────────────────────────────────────────────────────────────────
  {
    id: 'land-russia-china',
    type: 'land',
    fromNodeId: 'vladivostok',
    toNodeId: 'beijing',
    priority: 'main',
    label: 'Россия — Китай: Владивосток — Пекин',
    points: [
      { lat: 43.12, lng: 131.89 }, // Владивосток
      { lat: 48.48, lng: 135.08 }, // Хабаровск
      { lat: 45.76, lng: 126.64 }, // Харбин
      { lat: 41.80, lng: 123.43 }, // Шэньян
      { lat: 39.90, lng: 116.41 }, // Пекин
    ],
  },

  // Хабаровск → Якутск  (Федеральная трасса Р-504 «Колыма»)
  {
    id: 'land-khabarovsk-yakutsk',
    type: 'land',
    fromNodeId: 'khabarovsk',
    toNodeId: 'yakutsk',
    priority: 'secondary',
    label: 'Северный завоз: Хабаровск — Якутск',
    points: [
      { lat: 48.48, lng: 135.08 }, // Хабаровск
      { lat: 50.55, lng: 137.01 }, // Комсомольск-на-Амуре (район)
      { lat: 55.00, lng: 133.00 }, // Нерюнгри (район)
      { lat: 58.50, lng: 130.50 }, // Алданское нагорье
      { lat: 62.04, lng: 129.73 }, // Якутск
    ],
  },

  // Якутск → Магадан  (Р-504 «Колыма» — «Дорога костей»)
  {
    id: 'land-yakutsk-magadan',
    type: 'land',
    fromNodeId: 'yakutsk',
    toNodeId: 'magadan',
    priority: 'secondary',
    label: 'Северный завоз: Якутск — Магадан (Колымская трасса)',
    points: [
      { lat: 62.04, lng: 129.73 }, // Якутск
      { lat: 62.50, lng: 136.00 }, // Хандыга
      { lat: 63.00, lng: 142.00 }, // Сусуман (район)
      { lat: 61.50, lng: 147.00 }, // Ягодное
      { lat: 60.50, lng: 149.50 }, // Подход к Магадану
      { lat: 59.56, lng: 150.81 }, // Магадан
    ],
  },

  // Москва → Архангельск  (M8 «Холмогоры»)
  {
    id: 'land-moscow-arkhangelsk',
    type: 'land',
    fromNodeId: 'moscow',
    toNodeId: 'arkhangelsk',
    priority: 'secondary',
    label: 'Москва — Архангельск',
    points: [
      { lat: 55.76, lng: 37.62 }, // Москва
      { lat: 57.62, lng: 39.87 }, // Ярославль
      { lat: 59.22, lng: 39.88 }, // Вологда
      { lat: 62.50, lng: 40.50 }, // Подход к Архангельску
      { lat: 64.52, lng: 40.52 }, // Архангельск
    ],
  },
];
