# Service Icons

Custom SVG icon set for Pacific Star service pages, replacing the previous emoji-based icons.

## Icon inventory

| File name               | Service                                              | Visual concept                           |
|--------------------------|------------------------------------------------------|------------------------------------------|
| `northern-shipping.svg`  | Северный завоз (Northern delivery)                   | Cargo ship with snowflake accent         |
| `cabotage.svg`           | Каботаж ДФО / Портовые услуги (Cabotage / Port)      | Coastline with dashed route and ship     |
| `oversized.svg`          | Негабаритные перевозки (Oversized / project cargo)    | Lowbed trailer with large rectangular load |
| `remote-auto.svg`        | Автодоставка ДФО (Remote auto delivery)               | Truck on mountain road                   |
| `truck-delivery.svg`     | Автомобильные грузоперевозки (Truck delivery)         | Truck with route arrow                   |
| `rail.svg`               | Железнодорожные перевозки (Rail logistics)             | Container on flatcar with rail tracks    |
| `foreign-trade.svg`      | ВЭД / Международные (Foreign trade / international)   | Globe with import/export arrows          |
| `remote-regions.svg`     | Труднодоступные регионы (Remote regions)              | Mountains with location pin              |
| `air.svg`                | Авиационные перевозки (Air cargo)                     | Cargo airplane with boxes                |
| `warehouse.svg`          | Складские услуги (Warehouse)                          | Warehouse building with boxes            |
| `forwarding.svg`         | Экспедирование (Freight forwarding)                   | Clipboard with checklist                 |

## File location

All icons are stored in: `img/icons/services/`

## Technical details

- **viewBox**: `0 0 64 64` (all icons)
- **Colors**: `stroke="currentColor"` and `fill="none"` — inherits color from parent CSS
- **Stroke width**: `2.5` base (some details at `1.5` or `2`)
- **Style**: Simple geometric outlines, consistent corner radius, maritime / industrial tone

## CSS classes

### Service card icons (index.html)

```css
.service-card-img svg {
  width: 80px;
  height: 80px;
}
```

The `.service-card-img` container provides a gradient background (`--color-primary` → `--color-secondary`) and the SVG inherits white color.

### Service full-page icons (services.html)

```css
.service-full-icon svg {
  width: 48px;
  height: 48px;
}
```

### Service hero icons (individual service pages)

```css
.service-hero-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.92);
}

.service-hero-icon svg {
  width: 36px;
  height: 36px;
}
```

## How to add a new service icon

1. Create an SVG file in `img/icons/services/` with `viewBox="0 0 64 64"`, using `stroke="currentColor"` and `fill="none"`.
2. Embed the SVG inline in the appropriate HTML container (`.service-card-img`, `.service-full-icon`, or `.service-hero-icon`).
3. The icon will automatically inherit the brand color from its CSS context.

## Pages updated

- `index.html` — 6 service card icons
- `services.html` — 9 service full-card icons
- `severnyy-zavoz.html` — hero icon (northern-shipping)
- `kabotazh.html` — hero icon (cabotage)
- `negabarit.html` — hero icon (oversized)
- `avto-dfo.html` — hero icon (remote-auto)
- `remote-regions.html` — hero icon (remote-regions)
- `truck-delivery.html` — hero icon (truck-delivery)
- `rail.html` — hero icon (rail)
- `ved.html` — hero icon (foreign-trade)
