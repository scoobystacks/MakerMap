# Maker Map

An interactive, mobile-first map of makerspaces, fab labs, library maker labs,
and shared shops. Pins are color-coded by how you can get in, and every entry
lists equipment, how to get access, hours, and links.

Live site: <https://scoobystacks.github.io/MakerMap/>
(to be embedded at <https://jeffreyblitt.com/maker-map>).

- **Free & public** (green): open at no cost, often public libraries.
- **Paid access** (blue): memberships, day passes, punch cards, hourly rental.
- **Members only** (orange): a university, company, or community group.

## Running it locally

```sh
npm install
npm run dev        # http://localhost:5173/MakerMap/
npm run build      # validates data, type-checks, builds to dist/
npm run preview    # serves the production build
```

No API keys. Map tiles come from CARTO (OpenStreetMap data), place search uses
Nominatim, and the user's location never leaves the browser.

## Adding or fixing a space

The data lives in [`data/spaces.json`](data/spaces.json). The schema and the
rules for an entry are in [`data/README.md`](data/README.md). Either open a
pull request, or use the issue forms:

- [Suggest a space](https://github.com/scoobystacks/MakerMap/issues/new?template=suggest-space.yml)
- [Report a correction](https://github.com/scoobystacks/MakerMap/issues/new?template=report-correction.yml)

Only add a space you've verified is open and active from its own website, and
record the date in `lastVerified`.

## Deploying

Pushes to `main` build and deploy to GitHub Pages through
`.github/workflows/deploy.yml`. One-time setup in the repository settings:
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

The site is built for the `/MakerMap/` path. To build for a root domain
(for example a `makermap.jeffreyblitt.com` subdomain), set `BASE_PATH=/` when
building and add a `public/CNAME` file containing the hostname.

### Putting it on a Squarespace site

Squarespace can't host the app itself, so the page at `jeffreyblitt.com/maker-map`
embeds the GitHub Pages site:

1. Add a blank page with the URL slug `maker-map`.
2. Add a **Code** block containing:

   ```html
   <iframe src="https://scoobystacks.github.io/MakerMap/" title="Maker Map"
     style="width:100%;height:calc(100vh - 120px);min-height:600px;border:0"
     allow="geolocation" loading="lazy"></iframe>
   ```

   The `allow="geolocation"` attribute is what lets the embedded map ask for the
   visitor's location.
3. Set the page's padding to zero and hide the footer if you want it edge to edge.

## Project layout

```
data/spaces.json        the dataset (ODbL)
data/README.md          schema and contribution rules
scripts/validate-data.mjs  schema check run by `npm run build`
src/main.ts             app wiring: location, search, filters, detail panel
src/map/types.ts        the map interface the app codes against
src/map/leaflet.ts      Leaflet adapter (pins, user marker, tile themes)
src/map/index.ts        provider registry; swap libraries here
src/filters.ts          filtering and sorting
src/geo.ts              distance, geolocation, Nominatim geocoding
src/ui.ts               HTML rendering for list, detail, filter controls
src/theme.ts            light/dark toggle
src/types.ts            data types and label tables
```

## Swapping the map library

`src/main.ts` only talks to the `MapController` interface in
`src/map/types.ts`. Leaflet lives entirely in `src/map/leaflet.ts`. To try
another library, write a second adapter (for example `src/map/maplibre.ts`),
register it in `src/map/index.ts`, and build with
`VITE_MAP_PROVIDER=maplibre`. Pin styling is plain CSS in `src/style.css`
(`.pin`, `.you-marker`), so an adapter that renders HTML markers can reuse it.

## License

Code: [MIT](LICENSE). Data: [ODbL 1.0](data/LICENSE), the same share-alike
license OpenStreetMap uses, so improvements to the dataset stay open.
Map tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright)
contributors, © [CARTO](https://carto.com/attributions).
