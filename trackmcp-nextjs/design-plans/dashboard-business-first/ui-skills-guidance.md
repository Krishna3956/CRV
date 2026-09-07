# UI Skills guidance applied

The local environment did not expose installable `interface-design`, `improve-ui`, or `create-design-md` packages through its skill catalog or CLI. Their published guidance was reviewed and applied as design-only constraints; no package was installed and no production source was changed.

Sources:

- [interface-design](https://www.ui-skills.com/skills/dammyjay93/interface-design)
- [improve-ui](https://www.ui-skills.com/skills/ibelick/improve-ui)
- [create-design-md](https://www.ui-skills.com/skills/ibelick/create-design-md)

Applied decisions:

- audit the real rendered surface before proposing a replacement;
- preserve the product's identity and reuse the existing owners, tokens, and icon system;
- establish the human job and focal point before styling;
- render the states before implementation, including empty, insufficient, loading, error, focus-visible, and retry;
- use evidence-backed design tokens rather than invented values presented as product truth;
- keep advanced evidence progressive, but keep the business question primary;
- use a full-page Evidence surface for shareable links and browser history;
- avoid generic dashboard decoration and unsupported claims.

## Identity application

The wireframes reproduce the geometry and wordmark treatment of `TrackMCPLogo`, `TrackMCPAppIcon`, and `TrackMCPMark`. Navigation and interaction examples use the existing `lucide-react` icon vocabulary by name and stroke treatment. No plain-text replacement logo, Unicode icon, emoji, invented mark, or generic placeholder glyph is used in the revised rendered package.
