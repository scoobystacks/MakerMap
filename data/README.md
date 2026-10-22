# Maker Map data

`spaces.json` is the whole dataset: a JSON array with one object per space.
Run `npm run validate` after editing. The build fails on invalid data, so a
typo can't reach the live site.

## Rules for an entry

- **Verify it exists and is active** from the space's own website before
  adding it, and set `lastVerified` to the date you checked.
- Use `null` for anything you don't know. Never guess prices, years, or tools.
- Keep `equipment` to the 8–15 most notable items. Link the full list in
  `equipmentUrl`.

## Fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | kebab-case, unique, stable (it's used in links) |
| `name` | string | |
| `access` | `free` \| `paid` \| `restricted` | Drives pin color. `free` = open to the public at no cost (library card OK). `paid` = open to anyone for a fee (memberships, day passes, punch cards, hourly rental). `restricted` = a university, company, or community group. |
| `accessSummary` | string | 1–2 sentences on how to get in, with prices if listed |
| `accessUrl` | string \| null | page explaining how to join |
| `affiliation` | string \| null | required when `access` is `restricted` |
| `eligibility` | string \| null | who may use it |
| `venueType` | `makerspace` \| `library` \| `university` \| `corporate` \| `studio` \| `community` | |
| `address`, `city`, `state` | string | |
| `lat`, `lng` | number | decimal degrees |
| `website` | string | |
| `googleMapsUrl` | string \| null | a `https://www.google.com/maps/search/?api=1&query=…` link |
| `founded` | integer \| null | year it opened |
| `foundedNote` | string \| null | source or caveat for `founded` |
| `hours` | string \| null | short free text |
| `hoursUrl` | string \| null | |
| `equipmentCategories` | string[] | from the list in `src/types.ts` (`3d-printing`, `laser-cutting`, `cnc-machining`, `woodworking`, `metalworking`, `welding`, `electronics`, `textiles`, `sewing`, `embroidery`, `ceramics`, `printmaking`, `jewelry`, `glass`, `vinyl-cutting`, `large-format-printing`, `photography`, `av-media`, `computers`, `bikes`, `casting`, `robotics`, `prototyping`) |
| `equipment` | string[] | specific machines as the space lists them |
| `equipmentUrl` | string \| null | |
| `description` | string | 2–3 neutral sentences |
| `phone`, `email` | string \| null | |
| `sources` | string[] | URLs used to verify the entry |
| `lastVerified` | string | `YYYY-MM-DD` |

Licensed CC BY 4.0; see `LICENSE` in this directory.
