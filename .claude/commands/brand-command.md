---
description: Apply a client brand to the design system — two hexes and two fonts
argument-hint: [brand-hex] [accent-hex] [display-font] [body-font]
allowed-tools: Read, Edit, Grep, Glob
---

# Apply a client brand

Arguments, if any were given: $ARGUMENTS

## Step 1 — get the four values

If `$ARGUMENTS` is empty or incomplete, ask me for the missing ones. Ask all
outstanding questions in a single message, not one at a time:

1. **Primary brand hex** — the client's main colour. Buttons, links, brand text.
2. **Secondary accent hex** — a supporting colour. Secondary buttons, tinted
   bands, highlights. If they only have one colour, say so and I will decide
   whether to reuse the primary or pick a neutral.
3. **Display font** — headline family. Google Fonts name, or `system` for the
   default serif stack.
4. **Body font** — body copy family. Google Fonts name, or `system`.

Do not guess. Do not proceed on three of four.

## Step 2 — sanity check the pair before writing anything

Report all three of these to me, then continue unless something fails hard:

- **Hue separation.** Convert both hexes and report the angular distance
  between them. Anything from roughly 165 to 195 degrees is near
  complementary; those two colours will vibrate where they touch. Flag it and
  point at rule 4 in `_template.css`, but do not refuse — it is the client's
  brand, not my choice.
- **Chroma.** Report OKLCH chroma for each. Below about 0.06 means the ramp
  will be muted and the colour will read as a warm or cool neutral rather than
  a colour. Not a failure, but tell me so I am not surprised.
- **Identity drift.** The generator discards the input's lightness, so the hex
  I gave you will not appear in the ramp. The button will be a different shade
  of the same hue. `--color-brand-identity` keeps the exact hex for the logo.
  State this once so it is not a surprise later.

## Step 3 — write the values

In `_template.css`, replace the four placeholder values. Replace only these
four lines. Change nothing else in that file:

```css
--brand-base:  <brand hex>;
--accent-base: <accent hex>;
--font-display: '<Display Font>', Georgia, 'Times New Roman', serif;
--font-body:    '<Body Font>', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

If a font was given as `system`, leave that slot's stack as it is.

Remove the `UNSET — run /brand` comment blocks above each pair and replace them
with `/* Client: <name>, applied <date> */` if I gave you a client name.

## Step 4 — wire the fonts

If either font is a Google Font, add or update the font link in `index.html`,
directly above the `_template.css` stylesheet link:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=<Display+Font>:wght@400;500;600;700&family=<Body+Font>:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Load weights 400, 500, 600, and 700 for each family — those are the four weight
tokens and anything missing will silently synthesise a fake bold.

If both fonts are `system`, remove the font link and both preconnects entirely.
No point paying for a DNS handshake nothing uses.

## Step 5 — report

Tell me:

- the four values written,
- the hue separation and both chroma figures,
- which fonts are now loading and at which weights,
- and this exact instruction: **open the page and run `__brandContrast` in the
  console — every step should be at or above its target.**

## Do not

- Do not touch `brand-contrast.js`.
- Do not change any value in `_template.css` other than the four listed above.
- Do not add a colour picker, font picker, or theme UI. This command is the
  interface.
- Do not restyle components to "suit" the new brand. The tokens handle it.
