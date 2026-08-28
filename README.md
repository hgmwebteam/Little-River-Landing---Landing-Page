# Little River Landing

A blank version of the layout used on the Awayframes / Inspired Retreats /
Endless Stays / Out of Bounds / Ponderosa Pines / Stayluxe bio pages.
Every photo is a gray placeholder, and every piece of copy is written in
`[SQUARE BRACKETS]` so you can search for `[` and find everything that
still needs replacing.

## Files

| File | What it's for |
|---|---|
| `index.html` | The page itself — all the words, links, and images |
| `welcome.html` | The post sign-up page — where the form sends someone once they've handed over an email. The discount code, then the same "What We Offer" section |
| `_template.css` | The design system — the colour and type tokens everything else uses. This is where a client's brand goes |
| `styles.css` | The look of each section, built out of those tokens |
| `brand-contrast.js` | Corrects the brand colour ramp so text stays readable. Has to load in `<head>`, before anything paints |
| `script.js` | The moving parts — hero and closing video, the amenity deck, the review rail, card dragging |
| `assets/img/` | The placeholder images |

Load order matters: `_template.css`, then `styles.css`, then
`brand-contrast.js`. Rearranging them breaks the colours.

Double-click `index.html` to open it in a browser. There's nothing to
install and no build step. Both pages share every one of those files —
there is no second stylesheet and no second script.

## The section order

Close to the skeleton the reference pages are built on, with one
deliberate departure at the top — see the note under section 1.

1. **Hero offer** — full-bleed banner video, logo, headline, the offer, and
   the email box, all in one block
2. **Amenities** — the whole numbered list on the left with the one you are
   on lit, beside a stack of photo cards; scrolling lifts the front card off
   to show the next, and a "Check Availability" button sits under the list.
   On a computer the section holds still while you scroll
3. **Local Favorites** — photo cards with the name laid over the image and
   a line about the place in a panel across the bottom, each one a link
4. **Where We're Located** — the one left-aligned section: a hairline and the
   place name, a two-line heading whose second line is the welcome in italic,
   then a card with the address, phone, email and the route button beside a
   tall map, with two notes on driving and flying in under the card
5. **Testimonials** — panel with the Superhost badge, two stats, and a row of
   review cards stepped by arrow buttons
6. **Closing offer** — a photograph with the offer card laid over it: the
   card straddles the picture's edge rather than sitting beside it, and it
   holds the headline and the email box
7. **Footer** — "Marketing By" + agency logo

Two sections that exist in the template skeleton are **not on this page** —
Featured Stays and the Marquee were both removed. The numbers in the comment
headers inside `index.html` and `styles.css` still carry the skeleton's
original numbering, so they have gaps in them (there is no 3 or 4). That is
deliberate: the numbers are there to let you match a block of markup to its
block of CSS, and renumbering both files every time a section goes would
break that pairing for no gain.

**About section 1.** The reference pages put the banner photo and the offer
card in two stacked sections. Here they are one: the photo runs full bleed
and the copy and the email box sit on top of it, so the offer is the first
thing on the page instead of the second. That is why this list has nine
sections and the reference pages have ten.

Sections are self-contained. To drop one, delete its whole block, comment
header included, and to reorder, move the block — nothing else breaks. The
hero is a `<header>` rather than a `<section>`; everything after it is a
`<section>`.

## Changing the colors and fonts

A whole client brand is **four lines in `_template.css`**:

```css
--brand-base:   #4A5568;   /* the client's main colour  */
--accent-base:  #8A7F73;   /* a supporting colour       */
--font-display:  ...;      /* headline family           */
--font-body:     ...;      /* everything else           */
```

You only ever set those four. Everything else — the eleven shades of the
brand colour, which shade a button uses, which one text uses so it stays
readable — is worked out from them. No section in `styles.css` names a
brand colour or a font directly, which is why retinting the whole page is
a four-line job and not a find-and-replace.

(`styles.css` does hold a few fixed near-blacks, for the dark gradient over
the hero photo and for shadows. Those are not brand colours and do not
change per client.)

Fonts take one extra step, because naming a font is not the same as loading
it: in `index.html`, swap the Google Fonts `<link>` near the top to match
the two families you just set. If you skip it the page quietly falls back to
Georgia and the system sans and looks generic while appearing to work.

There is a `/brand` command that does all of this, including checking the
two colours are far enough apart to tell one from the other.

The reference pages each use a display font for headings plus a plain sans
for body text — Playfair Display + DM Sans, Dela Gothic One + Montserrat,
and so on. The template ships with Playfair Display + DM Sans.

## Replacing the images

Drop your real photos into `assets/img/` and point the `src="..."` at them.
Keep roughly these shapes so nothing gets awkwardly cropped:

| Placeholder | Shape to aim for |
|---|---|
| `hero-1/2/3.svg` | Wide landscape, 1600 × 1000 or similar |
| `logo-mark.svg` | Any shape. It is shown as it is, sized to a set height, so a square mark and a wide wordmark both work |
| `amenity-1…4.svg` | **Tall portrait**, roughly 576 × 784 — the deck's cards are portrait on a computer |
| `favorite-1…4.svg` | Tall portrait, roughly 576 × 784 — same as an amenity |
| `map.svg` | Roughly square, 1200 × 1000 — the frame is about that shape on a desktop and crops to fill |
| `claim-1.svg` | Tall portrait, roughly 1000 × 1250 — a band across the top on a phone, the left three quarters of the plate on a desktop, so it crops both ways |
| `super-host-logo-reversed.png` | Small wide logo — the real Airbnb Superhost badge, light version for the dark panel. (`review-badge.svg` is the unused original placeholder; `super-host-logo.png` is the dark-on-light version.) |
| `avatar-1…5.svg` | Square headshot, roughly 240 × 240 — the card crops it to a circle |
| `hiddengem-logo.svg` | Small wide logo |

Photos will be `.jpg` or `.png` rather than `.svg` — update the file
extension in the `src` when you swap them in.

## Putting a live map in section 6

The map ships as a placeholder image so the page renders with nothing filled
in and makes no third-party request. To use a real, interactive map:

1. Open Google Maps and search for the property.
2. **Share → Embed a map → Copy HTML.**
3. In `index.html`, inside `<div class="location-map">`, delete the `<img>`
   line and uncomment the `<iframe>` line below it.
4. Paste the `src="..."` value from Google's HTML into the iframe's `src`.

The rounded frame, the border and the grayscale-until-hover treatment apply
to the iframe exactly as they do to the image, so nothing else changes. If
the client's brand is dark, the note above `.location-map` in `styles.css`
explains the one-word change that darkens Google's white map to match.

**One thing to watch on phones.** A Google map takes over vertical swipes
inside its own box, so a guest scrolling down the page can reach the map and
find themselves panning it instead of scrolling on. The map sits high in the
phone layout — right under the heading — which is where you want it, but it
also means most guests will swipe across it. If it becomes a complaint, the
fix is a tap-to-activate overlay: the map ignores touches until it is tapped
once. That needs a few lines of JavaScript, so it is not in the template.

## The icons

There is a ten glyph set — phone, mail, car, train, route, pin, clock, peak,
home, star. Section 6 uses five of them and section 7 uses the star; the rest
are there to swap in. They are
single-colour shapes that take their colour from the text beside them, so they
work on a light brand and a dark one without editing.

Swap one by changing its class: `icon--car` to `icon--train`, and so on. Three
sizes: `icon--sm` (16px), the default (20px), and `icon--lg` (24px). To add a
glyph, copy any `--icon-*` line at the top of the ICONS block in `styles.css`,
paste the new SVG path into it, and add a matching `.icon--name` line below.

## Adding or removing cards

Each card is one repeated block. Copy the block, paste it, change the words
and the image:

- An amenity → `<li class="process__step"> ... </li>` **plus** a `<div class="process__card">` in `.process__media`
- A local favorite → `<a class="tall-card"> ... </a>`
- A review → `<article class="review"> ... </article>`

Local favorites used to settle into a tidy row on desktop on their own; they
now stack instead (see below).

**About the reviews.** This row behaves differently depending on what the
guest is holding, but nothing about it moves on its own any more.

**On a phone** it is a plain swipe track, the same as the local favourites
row. One set of cards, snapping one at a time, moving only when a thumb
moves it. No arrows — the swipe is the obvious gesture and two more tap
targets would only crowd the panel.

**Where there is a mouse** two arrow buttons appear under the row and step
it one card at a time. They grey out at each end, and if every card already
fits on screen they hide themselves entirely.

**It used to scroll itself** on a loop, with hovering as the only way to
stop it. That is gone, and with it a rule you no longer have to follow: the
card count had to be EVEN, because the loop was built from a cloned copy of
the set. **Add or remove review cards freely now** — one or nine, the
arrows work the spacing out from the cards themselves.

**About Amenities.** This one is built differently from every other
section, so it is worth reading before you edit it.

On a computer the section is several screens tall and everything in it
**holds still** while you scroll through it: all four amenities listed on
the left with the one you are on in full white and the rest faded back, a
"Check Availability" button under the list, and a stack of photo cards on
the right. Scrolling lifts the front card up and off to show the one behind
it and moves the highlight down the list. Nothing on the screen moves
except those two things.

**Each amenity carries a large numeral down its left side**, and the one-line
description **opens under the name of whichever amenity you are on** — the
others stay closed. The numeral is what makes that affordable: it is tall
enough that a closed step is already about as tall as an open one, so the
line unfolds into space that was there anyway and the list barely settles.
The description used to sit on the photograph instead; it does not any more,
and **the photograph now carries no text at all**.

**Clicking an amenity goes to it.** The whole row is the target — the numeral
and the name, not just the words — and pressing one scrolls the page to where
that amenity comes up. It cannot simply light the one you pressed: on a
computer this section's state is purely a function of how far down it you
are, so anything set directly would be overwritten the moment you touched the
wheel. Moving the page is the thing that lasts. Hovering a row brings it
partway up, which is what says it can be pressed at all.

**Four dots run down the right of the photo**, one per amenity, with the one
you are on lit and larger, and **clicking one does the same thing** — it is
the same jump, offered next to the picture. Both are keyboard-reachable and
both announce the amenity's name. The dot you see is 6px but the thing you
are clicking is 40x24, so it is not the pinprick it looks like.

The rail **does not appear at all if JavaScript has not run**. There would be
no highlight to indicate and nothing for a click to do, so four dead dots
would be worse than none.

On a phone none of that happens. It is one column, nothing pins, and each
amenity simply carries its own photograph directly above its own name —
which says the same thing without spending a phone's scroll on it. The
button goes full width at the bottom of the section.

**On a phone the same button is the photograph**, and tapping it opens the
description rather than scrolling anywhere — one control per amenity meaning
"press this amenity" at both widths, doing whatever that width requires.

**Tapping an amenity's photograph on a phone opens its description**, which
unfolds under the name and dims the picture behind it without hiding it.
Tapping it again closes it, and opening a second one closes the first —
four open descriptions is four dimmed photographs and the section stops
reading as a run of pictures. Nothing moves on the page when it opens: the
text grows up into the photo, which is a fixed height.

**The button is one element in the markup, not two.** The wrapper around
the left-hand column dissolves on a phone, so the same tag is "under the
list" on a computer and "at the bottom of the section" on a phone without
being duplicated. Its link is on that one tag — search `process__cta`.

**Each amenity is two pieces of markup, not one.** The words live in an
`<li class="process__step">` and the photo lives in a
`<div class="process__card">` inside `.process__media` higher up. They are
paired by the `data-step` number they share — step 0 goes with the first
card, step 1 the second. If you add a fifth amenity, add `data-step="4"`
to the new `<li>` **and** a fifth card with `data-step="4"`, or the new
amenity will leave the previous photo on screen.

**The description is typed once**, in the `<li>` as
`<p class="process__desc-text">`, and both layouts read that one copy — the
phone opens it on a tap, the computer opens it on the amenity you are level
with. It used to be typed a second time on the card and the two could drift
apart; that copy is gone.

**Four things have to be kept in step by hand when you add or remove an
amenity:**

1. The `data-step` numbers, as above.
2. **The order of the cards in the markup is the order of the stack**, front
   to back. It has to match the order the amenities are listed in.
3. **A dot for the new amenity** in the `.process__dots` rail at the end of
   `.process__media`, carrying the same `data-step` **and** an
   `aria-labelledby` pointing at the new heading's id. Miss the dot and the
   rail says there are four amenities when there are five; miss the
   `aria-labelledby` and the jump button announces the wrong one.
4. `--process-count` in `styles.css` (search for it — it is in the pinned
   amenities block), which sets how long the section is. `script.js` corrects
   it from the real count as soon as the page loads, so getting it wrong only
   affects the split second before that and anyone browsing without
   JavaScript — but keep it right anyway.

A new `<li>` also carries three `amenity-N-…` ids that have to be unique and
have to match each other: the heading's `id="amenity-4-title"`, the
description's `id="amenity-4-desc"`, and the button's `aria-labelledby` and
`aria-controls` pointing at those two. That is what tells a screen reader
which name the tap target has and what it opens. Copying an existing block
and forgetting to bump the number is the easy mistake — two elements with
the same id, and the button announces the wrong amenity.

The numbers are drawn by CSS, not typed. Delete the middle amenity and the
rest renumber themselves. They read `01` `02` `03` on a phone, where they
are small labels above each photograph, and `1` `2` `3` at display size in
the margin on a computer.

**A fifth amenity is the point at which to stop and think.** Every one added
makes the section another screen taller on a computer, and the left column
has about 18px of room left at the shortest window the pinned layout runs at
— see the height-gate note in `styles.css`. A fifth will not fit there
without something else giving.

On a phone the amenity's name is laid over the foot of its own photograph
behind a short gradient band, rather than sitting underneath it. The band
is only as tall as the words — the picture stays a picture — and grows to
about twice that while the description is open. Keep the bottom of the
frame free of anything that matters, because that is where the name goes,
and on a computer the description goes in the same place on the card.

Amenity photos are **tall portrait** now — roughly 576 × 784, the same shape
as a local favorite. That is a change back from the 4:3 landscape the section
briefly wanted, because the deck's cards are portrait. Keep the subject near
the middle; the frame crops top and bottom on a short window.

The card is capped at **786px tall**, which is the photo's own height, so on a
tall monitor the picture is shown uncropped rather than stretched into a
column. Above that height the whole two-column block centres itself in the
screen instead of hanging from the top.

**The dark wash on the left is not decoration.** The inactive amenities are
faded back to half strength, and that only clears accessible contrast because
the ground behind the words is darkened first — that is what
`.section--process::after` (search for "copy scrim") is doing. If you remove
it or lighten it, the faded text stops being legible enough to pass. If you
want the faded amenities dimmer still, read the measured figures in the
comment above the fade in `styles.css` first; there is a floor and it is close.

**On a short window the whole pinned layout switches off.** Under 640px of
browser height it falls back to the phone version — one column, a photo per
amenity — because a pinned screen cannot be scrolled, so anything that did
not fit inside it would be cut off with no way to reach it. If you make the
intro paragraph much longer, re-check it at 1280 × 640.

**About the local favorite cards.** The photo is the whole card. The name
sits over the top left of the image and a line about the place sits in a
panel across the bottom. The top of every photo is shaded so the name
stays readable whatever the photo turns out to be — that shading is doing
real work, not decoration, so it is worth leaving alone.

Each one is a link. Put the place's website, Google Maps listing, or
booking page in its `href`.

The card rules are still written to be shared, so a future section can
pick the same card up without touching them. They change shape three
times as the screen grows:

| Screen | Layout |
|---|---|
| Phone, under 640px | One per row, stacked down the page |
| 640px to 1023px | Two across |
| 1024px and up | Four across, in one row |

On a computer that four-across row behaves as an accordion: mousing over
a card widens it and its neighbours give up the room, and the
description panel fades in as it does. On a phone the panel is not drawn
at all — the cards read better as photographs at that size, and the
description was covering the bottom third of the picture it describes.

Nothing is lost to a screen reader by that. The panel is hidden with
`opacity: 0`, not `display: none`, so the description is still in the
document and still announced; it is also revealed by `:focus-within`,
which is ungated, so anyone tabbing to a card sees it on any device.

Leave the `alt=""` on these photos empty, amenity and favorite alike. The
name is already on the page as real text beside the photo, so filling in
alt as well makes a screen reader read it twice — and on a favorite the
link takes its name from that same visible text, so an empty alt is what
keeps the link announced as the place rather than as the place twice
over. Write alt text only if the photo shows something the name and
description do not already say.

Favorite photos are cropped to fill. Keep the subject near the middle of
the frame: the card is portrait on a computer and wider than it is tall
on a phone, so a photo that only works one way round will lose something
at one of those sizes. The top and bottom edges are where the name and
the panel sit, and the sides get trimmed when a card widens.

The rail behaviour this describes — one horizontal row at every width,
swipeable on a phone, draggable with arrow buttons on desktop — belonged to
Featured Stays, which is no longer on this page. The CSS for it is still in
`styles.css` under `.slider--rail`, so a future section can pick it up
without any of it being rewritten.

## The post sign-up page

`welcome.html` is where someone lands after handing over their email. It is
three things:

1. The back link, the mark, a greeting, and **the discount code** — the whole
   reason the page exists.
2. The same "What We Offer" section as `index.html`, copied across word for
   word, so the page has somewhere to send them next.
3. The same footer.

**To change the code**, open `welcome.html` and edit it in *two* places. It
appears once as the text people read and once as `data-code="..."` on the
Copy button, which is the value that actually reaches the clipboard. Change
one and not the other and the button copies the wrong thing.

**To point the form at it**, put `welcome.html`'s live URL in your form
handler's redirect or thank-you setting — the same place you set
`[FORM ACTION URL]`. Nothing on this end needs to change.

**The Copy button** only appears once the script has loaded, which is on
purpose: without it the code is still there as ordinary selectable text, and
one click takes the whole thing. Copying works over `https` and on
`localhost`. Opening the file straight off disk with `file://` falls back to
an older method that still works in every browser that matters, but if you
are demoing the page, serve it rather than double-clicking it.

**Section 2 is a copy, not a include.** If an amenity is renamed, added, or
re-photographed on `index.html`, make the same edit here. Nothing checks that
the two are still in step.

The page carries `<meta name="robots" content="noindex">`, because a
confirmation page reached from a form has no business turning up in search
results.

## The email forms

There are two — the one in the hero and the one in the closing offer — and
both point at `action="[FORM ACTION URL]"`. Replace that in both places with
the real form or funnel URL. Until you do, submitting shows a reminder popup
instead of quietly failing.

The two are laid out differently on purpose. The hero's box goes side by
side — field, then button — as soon as there is room. The closing one does
that too on a phone and a tablet, then goes back to stacked on a desktop,
because up there it lives inside a fixed 480px card and an inline button
would leave the field about 210px wide. Stacked, the button runs the full
width of the card.

Each one has a label reading "Email address" that is deliberately invisible
on screen. It is there so screen readers can tell people what the box is
for; the grey "Enter your email" inside the box is a hint, not a label, and
assistive software is not required to read it out. Deleting the label makes
the form unusable for those visitors, so leave it alone.

## Three knobs in the hero

Set in `styles.css`, near the top:

| Knob | What it does |
|---|---|
| `--hero-focal` | Which part of the banner photo stays in frame when it gets cropped. `50% 42%` is slightly above centre, which keeps horizons out of the copy. Nudge it if a photo crops badly |
| `--glow-core` / `--glow-mid` | How strong the soft glow behind the discount is. It takes its colour from the brand automatically, so it only needs touching if it reads too faint or too loud |
| `--hero-logo` / `--hero-logo-lg` | Logo height on phones and on desktop |

One thing that is not a knob: the headline is capped at about **19
characters, or three words**. Past that it runs to three lines and stops
reading as a headline. The column is deliberately not wider — past a point
the copy crosses into the bright part of the photo and gets hard to read.

## The scroll animations

Every block below the hero starts a little low and a little transparent and
settles as it comes into view. Once — scrolling back up does not replay it.
The hero is separate: it has always animated on load, and it still does.

You add or remove it with two attributes in `index.html`. Nothing goes in
the CSS.

| Attribute | Put it on | What happens |
|---|---|---|
| `data-reveal` | one element | it comes in on its own |
| `data-reveal-group` | a parent | its direct children come in one after another, 70ms apart, off the parent's arrival |

A group is what a card rail needs. The cards off the right-hand edge of the
screen never come into view on their own, so watched individually they would
sit invisible until somebody swiped them across.

Both attributes take a value, and it picks how the thing moves:

| Value | Movement | Use it for |
|---|---|---|
| *(empty)* | rises 16px and fades | ordinary blocks — headings, copy, cards |
| `settle` | scales from 98% and fades | anything inside a rail, and photographs |
| `fade` | fades only | anything already moving, or pinned with `position: sticky` |

`settle` on a rail card is not a style choice. A downward slide inside a
scrolling row adds real scrollable height to that row and the rail twitches;
scaling down cannot. Same for `fade` on a pinned element — a transform on a
sticky box changes what its contents are positioned against. If you are
adding a card to an existing rail you do not need to know any of this: the
group already says `settle` and the new card inherits it.

**A group's value is a default.** A child with its own `data-reveal` keeps
what it says. That is how the amenity deck fades while the heading above it
rises, inside the same group.

**Nothing here can hide your page.** The whole effect is gated on a class
that a small script in `<head>` only adds when there is an
`IntersectionObserver` to take it off again and the visitor has not asked
for reduced motion. No JavaScript, broken JavaScript, an old browser, or
"reduce motion" switched on in System Settings — all four give the same
page, with everything on it and nothing waiting.

## One thing worth knowing

The six reference pages are GoHighLevel (LeadConnector) funnels, not
hand-built sites — that's what the `assets.cdn.filesafe.space` image links
and the `leadconnectorhq.com` scripts in their source are. This template
reproduces the **design and section structure** as plain HTML and CSS. It
is not a GoHighLevel funnel and won't import into one as-is. If the goal is
a new funnel in GHL, the faster route is cloning an existing funnel there
and swapping the content; this template is the better route if you want a
standalone page you host yourself, or a reference for what the layout is
made of.
