/* ============================================================
   Small helpers for the template.
   You shouldn't need to edit anything in here to launch a page.
   ============================================================ */
(function () {
  'use strict';

  /* --- HERO SLIDESHOW ----------------------------------------
     Fades between the .hero-offer__slide images. With only one slide
     it simply does nothing. Change the speed with
     data-interval="5000" on the .hero-offer__slides element (ms).

     Does not run at all for a visitor who asks for reduced motion.
     _template.css zeroes every transition-duration with !important
     under that preference, so the fade would become a hard flash-cut
     every few seconds — and content that moves for longer than five
     seconds with no way to stop it fails WCAG 2.2.2 anyway. They get
     the first photo, held.
  ------------------------------------------------------------ */
  var stillPlease = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-slideshow]').forEach(function (box) {
    var slides = box.querySelectorAll('.hero-offer__slide');
    if (slides.length < 2 || stillPlease) return;

    var wait = parseInt(box.dataset.interval, 10) || 5000;
    var i = 0;

    setInterval(function () {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }, wait);
  });

  /* --- BACKGROUND VIDEO --------------------------------------
     Two videos, started two different ways.

     The hero autoplays from the markup: the browser starts it
     without help, and doing it here would mean the hero is a still
     until this file has run. All the first block does is take it
     away again from a visitor who asked for reduced motion.
     Twelve looping seconds with no control to stop it is the same
     WCAG 2.2.2 problem the old slideshow had, and pausing at frame
     zero leaves them the poster — a frame of the same clip — so
     they lose the motion and nothing else. pause() alone is not
     enough, because autoplay may not have fired yet, which is why
     the load and play events are caught too.

     The closing offer's copy autoplays from the markup too, and
     carries data-play-in-view on top of it. The attribute is what
     starts it — a scripted play() is one more thing a browser can
     refuse — and the block below only pauses it once it is off
     screen, retries if autoplay was declined, and holds it on the
     poster under reduced motion.
  ------------------------------------------------------------ */
  document.querySelectorAll('.hero-offer__video').forEach(function (video) {
    if (!stillPlease) return;

    var hold = function () {
      video.pause();
      /* Back to the poster frame, not wherever autoplay got to. */
      try { video.currentTime = 0; } catch (e) {}
    };

    video.removeAttribute('autoplay');
    video.addEventListener('loadeddata', hold);
    video.addEventListener('play', hold);
    hold();
  });

  document.querySelectorAll('[data-play-in-view]').forEach(function (video) {
    if (stillPlease) {
      video.removeAttribute('autoplay');
      video.pause();
      return;
    }

    /* The browser's own autoplay is what starts this. Everything here
       is either insurance or the pause on the way out.

       nudge() covers the case where autoplay was declined — Safari in
       Low Power Mode is the common one — and it runs on the way in
       rather than at load, so the request is made at the moment the
       panel is actually on screen. A rejection is expected and
       ignored: there is nothing to do about it, and an unhandled
       rejection is console noise. */
    var nudge = function () { if (video.paused) video.play().catch(function () {}); };

    if (!('IntersectionObserver' in window)) { nudge(); return; }

    /* 200px of margin so the panel is already moving by the time it
       is read rather than starting on a poster the visitor is looking
       at. Pausing on the way out is the point of the observer: a
       second copy of the hero's footage decoding behind the footer
       for the whole visit costs battery and buys nothing. */
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) nudge();
        else video.pause();
      });
    }, { rootMargin: '200px 0px' }).observe(video);

    /* Last resort. If autoplay was refused outright, a muted video is
       allowed to start once the visitor has interacted with the page
       at all — so the first scroll, tap or key is enough. Once only. */
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (evt) {
      window.addEventListener(evt, nudge, { once: true, passive: true });
    });
  });

  /* --- SLIDER DRAG -------------------------------------------
     Lets a mouse drag the card rows sideways on desktop, the
     same way a finger swipes them on a phone.
  ------------------------------------------------------------ */
  document.querySelectorAll('[data-slider] .slider__track').forEach(function (track) {
    var down = false, startX = 0, startScroll = 0;

    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true;
      startX = e.clientX;
      startScroll = track.scrollLeft;
    });

    track.addEventListener('pointermove', function (e) {
      if (!down) return;
      var moved = e.clientX - startX;
      if (Math.abs(moved) > 4) e.preventDefault();
      track.scrollLeft = startScroll - moved;
    });

    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (evt) {
      track.addEventListener(evt, function () { down = false; });
    });
  });

  /* --- RAIL ARROWS -------------------------------------------
     Steps the rail by whole cards. Reading the card's own width
     off the DOM rather than hard coding it means the CSS stays
     the single source of truth for how wide a card is.
  ------------------------------------------------------------ */
  var stillMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('[data-rail-nav]').forEach(function (nav) {
    var section = nav.closest('section');
    if (!section) return;

    /* TWO ELEMENTS, NOT ONE, because in general they are not the
       same element. The scroller is whatever carries the overflow;
       the item holder is whatever the cards are children of.

       On the reviews they differ — a max-content track inside a
       narrower viewport, so the viewport scrolls and the track
       holds the cards. On a .slider__track rail they are the same
       element, which is what the fallback covers: a section that
       marks neither attribute still works, so this stays
       compatible with the markup it was originally written for. */
    var scroller = section.querySelector('[data-rail-scroller]')
                || section.querySelector('.slider__track');
    var items    = section.querySelector('[data-rail-items]') || scroller;
    var prev     = nav.querySelector('[data-rail-prev]');
    var next     = nav.querySelector('[data-rail-next]');
    if (!scroller || !items || !prev || !next) return;

    /* How far one card is from the next, measured BETWEEN two of
       them rather than computed from a width plus a gap.

       The computed version was wrong on this rail and wrong
       quietly: it read columnGap, and the review cards are spaced
       by margin-right on each card rather than by a gap on the
       track — so it returned one card wide with no spacing, and
       every press would have left the rail short of the snap
       point by that margin. Measuring the distance between two
       cards gets the right answer whichever way the spacing is
       done, which also means the CSS stays free to change it.

       The width-plus-gap path is kept for the one-card case, where
       there is no second card to measure against. */
    function step() {
      var cards = items.children;
      if (!cards.length) return scroller.clientWidth;
      if (cards.length > 1) {
        var pitch = cards[1].getBoundingClientRect().left
                  - cards[0].getBoundingClientRect().left;
        if (pitch > 1) return pitch;
      }
      var declared = parseFloat(getComputedStyle(items).columnGap) || 0;
      return cards[0].getBoundingClientRect().width + declared;
    }

    /* Where each card would come to rest, in the scroller's own
       scroll coordinates. Derived from live rects rather than from
       offsetLeft, which is measured against the nearest positioned
       ancestor and so is only the same number by coincidence.

       THE + scroller.scrollLeft IS THE WHOLE POINT and it belongs
       on exactly one side of the subtraction. A rect is measured
       against the viewport, so it already moves as the rail
       scrolls; adding the current scroll back converts it into a
       position in the content that does not. Written with the
       scroll added to both the card and the origin — which is the
       shape this first took — the two cancel and the function
       returns each card's CURRENT distance from the left edge
       instead. It then looks right at scrollLeft 0 and is wrong
       everywhere else, so it half worked: snap corrected the bad
       targets at some widths, and at 1100x800 it left prev dead
       at the end of the rail, computing stops of [0,0,170,570]
       for a rail whose real stops are [0,400,630].

       scroll-padding-left is subtracted because that is what a
       snap lands on: the track carries a gutter and the viewport
       carries a matching scroll-padding, so the first card's
       resting position is 0 and not the width of the gutter.

       Clamped to the scrollable range and de-duplicated, because
       past the end several cards resolve to the same final
       position and a duplicate stop would be a press that does
       nothing. */
    function stops() {
      var origin = scroller.getBoundingClientRect().left;
      var pad = parseFloat(getComputedStyle(scroller).scrollPaddingLeft) || 0;
      var max = scroller.scrollWidth - scroller.clientWidth;
      var out = [];
      Array.prototype.forEach.call(items.children, function (card) {
        var at = card.getBoundingClientRect().left - origin + scroller.scrollLeft - pad;
        if (at < 0) at = 0;
        if (at > max) at = max;
        if (!out.length || Math.abs(at - out[out.length - 1]) > 1) out.push(at);
      });
      return out;
    }

    /* GOES TO THE NEXT CARD, not a card's width along, and the
       difference shows at the ends of the rail.

       scrollBy(pitch) was the obvious version and it had a bug.
       The track snaps mandatorily, so the browser pulls whatever
       position the scroll lands on to the nearest card — and at
       the right hand end the rail is clamped part way through a
       step, so from there one press of prev moved back a full
       card width, landed between two cards nearer the first, and
       snap took it to the very start. One press, two cards
       skipped. Measured at 1440x900: 530 -> 0 instead of 530 -> 400.

       Choosing the target from the list of card positions cannot
       do that. The pixel step is kept as a fallback for a rail
       whose cards cannot be measured. */
    function go(dir) {
      var at = scroller.scrollLeft;
      var list = stops();
      var target = null;

      if (dir > 0) {
        for (var i = 0; i < list.length; i++) {
          if (list[i] > at + 1) { target = list[i]; break; }
        }
      } else {
        for (var j = list.length - 1; j >= 0; j--) {
          if (list[j] < at - 1) { target = list[j]; break; }
        }
      }

      if (target === null) target = at + dir * step();

      scroller.scrollTo({
        left: target,
        /* An explicit 'smooth' here would win over the reduced
           motion rule in _template.css, which only reaches the
           CSS scroll-behavior property. So the check is here. */
        behavior: stillMotion.matches ? 'auto' : 'smooth'
      });
    }

    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });

    /* A spent arrow is disabled rather than left live, so a
       keyboard user is not tabbing onto a control that does
       nothing. 1px of slack absorbs sub pixel scroll positions.

       On a wide monitor every card fits and the rail has nothing
       left to travel, so the whole control goes away instead of
       sitting there permanently dead. The threshold is a gap
       rather than zero: sub pixel rounding on the rail's padding
       leaves a few stray pixels of scroll that are not worth a
       button. Re-runs on resize, so it comes back if the window
       narrows. */
    function sync() {
      var max = scroller.scrollWidth - scroller.clientWidth;
      nav.hidden = max <= 24;
      prev.disabled = scroller.scrollLeft <= 1;
      next.disabled = scroller.scrollLeft >= max - 1;
    }

    scroller.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  /* --- AMENITY STEPS -----------------------------------------
     Lights the step nearest the middle of the screen and deals
     the deck beside it to match.

     The band is the middle 20% of the viewport: rootMargin pulls
     the observer's top and bottom edges in by 40% each, leaving a
     stripe across the centre, and a step counts as active while
     it crosses that stripe. Watching for "is it on screen at all"
     instead would light three steps at once on a tall monitor.

     The is-enhanced classes are added from in here rather than
     sitting in the markup, so the dimming only ever applies once
     there is something running to undim it again. If this file
     fails to load the section is a plain numbered list with its
     first photo showing, which is a fair way for it to end up.
  ------------------------------------------------------------ */
  document.querySelectorAll('[data-process-steps]').forEach(function (list) {
    var steps = list.querySelectorAll('.process__step');
    var frame = document.querySelector('[data-process-media]');
    var cards = frame ? frame.querySelectorAll('.process__card') : [];

    // The blurred wash behind the section, swapped in step with the
    // deck. Optional — the section works without it, so everything
    // below guards on it rather than assuming it is in the markup.
    var back  = document.querySelector('[data-process-backdrop]');
    var washes = back ? back.querySelectorAll('.process__backdrop-img') : [];

    // The dot rail beside the deck. Optional in the same way the wash
    // is: the section reads without it, so everything below guards on
    // it rather than assuming it is in the markup.
    var rail = document.querySelector('[data-process-dots]');
    var dots = rail ? rail.querySelectorAll('.process__dot') : [];

    /* THE SAME QUERY THE PINNED LAYOUT IS GATED ON IN styles.css.
       Declared up here rather than down beside the driver it
       belongs to, because show() runs once during setup below and
       has to know which layout it is in before that driver exists.
       The note on why the query is what it is, is at the driver. */
    var wide = window.matchMedia('(min-width: 1024px) and (min-height: 720px)');

    if (!steps.length) return;

    // The step showing right now. readProgress runs every frame of
    // a scroll and lands on the same step for most of them; this is
    // what makes all but the transitions cost nothing.
    var current = null;

    /* All this hands the CSS is one number per card: how far back
       in the deck it now sits. Everything the deck looks like —
       the offset, the shrink, the shade, the stacking order — is
       derived from that number in the stylesheet, so the shape of
       the effect stays somewhere it can be retuned without coming
       back in here.

       Negative depth is a card already read. It gets .is-spent
       and its --depth is pinned at 0, because a card being lifted
       off the front is lit and full size on the way out — reading
       -1 there would shade and shrink it mid-lift.

       .is-active is set as well as depth 0, purely so the
       reduced-motion rules have something to hook: with the
       transforms off, "which one is showing" cannot be read out
       of a custom property. */
    function deal(activeIndex) {
      cards.forEach(function (card, i) {
        var depth = i - activeIndex;
        card.classList.toggle('is-spent',  depth < 0);
        card.classList.toggle('is-active', depth === 0);
        card.style.setProperty('--depth', depth < 0 ? 0 : depth);
      });
    }

    function show(step) {
      current = step;
      steps.forEach(function (s) { s.classList.remove('is-active'); });
      step.classList.add('is-active');

      // Pair by data-step, not by position, so the card still
      // follows its step if the two lists are ever a different
      // length. If nothing matches, the deck is left exactly as
      // it was rather than collapsing to the front card.
      var want = step.getAttribute('data-step');
      var found = -1;
      cards.forEach(function (card, i) {
        if (card.getAttribute('data-step') === want) found = i;
      });
      if (found !== -1) deal(found);

      washes.forEach(function (img) {
        img.classList.toggle('is-active', img.getAttribute('data-step') === want);
      });

      // Paired by data-step like everything else in here, so a dot
      // follows its amenity rather than its place in the rail.
      //
      // aria-current as well as the class, because these are
      // buttons now: the class is what the stylesheet lights up and
      // aria-current is what says "this is the one you are on" to a
      // reader who cannot see it lit. Removed rather than set to
      // "false" on the others — aria-current="false" is a value the
      // spec treats as absent but some readers still announce.
      dots.forEach(function (dot) {
        var on = dot.getAttribute('data-step') === want;
        dot.classList.toggle('is-active', on);
        if (on) dot.setAttribute('aria-current', 'true');
        else    dot.removeAttribute('aria-current');
      });

      /* THE OPEN STATE IS SCROLL-DERIVED IN THE PINNED LAYOUT, so
         it is written from here rather than from the click handler.
         The description showing up there is the active step's, which
         means the button reporting itself expanded has to be the
         active step's too, whether the reader got there by pressing
         it or by scrolling past it.

         Gated on the breakpoint because on a phone this attribute
         belongs to the tap handler — there the description opens
         because it was tapped, not because it was scrolled to, and
         show() writing it as well would fight the tap. */
      if (wide.matches) {
        steps.forEach(function (s) {
          var t = s.querySelector('.process__toggle');
          if (t) t.setAttribute('aria-expanded', s === step ? 'true' : 'false');
        });
      }
    }

    list.classList.add('is-enhanced');
    if (frame) frame.classList.add('is-enhanced');
    if (back)  back.classList.add('is-enhanced');
    if (rail)  rail.classList.add('is-enhanced');
    show(steps[0]);

    /* --- PRESS AN AMENITY -----------------------------------
       ONE BUTTON PER AMENITY, TWO LAYOUTS, ONE MEANING: press this
       amenity and it becomes the one you are reading. What that
       takes is different at the two widths, which is the branch
       below and the only thing in here that is.

       PHONE — the button is the photograph, and pressing it opens
       the description under the name. One open at a time: four
       open descriptions is four darkened photographs and the
       section stops being a run of pictures, which is the thing
       the overlay was introduced to protect. Pressing a second
       amenity closes the first; pressing the open one closes it.

       PINNED — the button is the whole row, numeral and name, and
       pressing it scrolls the page to where that amenity comes up.
       It CANNOT just set the class: up here .is-active is a pure
       function of scroll position, recomputed on the next frame of
       the next scroll, so anything written directly would be
       overwritten within a frame of the reader touching the wheel.
       Moving the page is the only thing that lasts, and the driver
       lights the step on the way. Which also means the open state
       is not this handler's to manage up there — show() owns it,
       including the aria below.

       The class goes on the <li> and aria-expanded goes on the
       button, and both are written from the same place so they
       cannot drift — the class is what the stylesheet reads and
       the attribute is what a screen reader reads, and a state
       that is only in one of them is a bug in the other.
    ------------------------------------------------------- */
    steps.forEach(function (step) {
      var toggle = step.querySelector('.process__toggle');
      if (!toggle) return;

      toggle.addEventListener('click', function () {
        if (wide.matches) { goToStep(step); return; }

        var open = !step.classList.contains('is-open');

        steps.forEach(function (s) {
          var t = s.querySelector('.process__toggle');
          s.classList.remove('is-open');
          if (t) t.setAttribute('aria-expanded', 'false');
        });

        if (open) {
          step.classList.add('is-open');
          toggle.setAttribute('aria-expanded', 'true');
        }
      });
    });

    /* --- WHICH STEP IS ACTIVE -------------------------------
       Two drivers, because there are two layouts and they
       disagree about what "reaching an amenity" means.

       ABOVE 1024px the section is a scroll track: the grid is
       pinned, the steps do not move, and all four are on screen
       at once. Nothing crosses anything, so there is nothing for
       an IntersectionObserver to observe — the active step is a
       function of how far through the track the page has
       scrolled, and that is what readProgress works out.

       BELOW 1024px the steps scroll normally, each carrying its
       own photo, and the old observer is exactly right: a step
       is active while it crosses a stripe across the middle of
       the screen. rootMargin pulls the observer's top and bottom
       edges in by 40% each to leave that stripe. Watching for
       "on screen at all" instead would light three at once.

       Both are torn down and rebuilt on a breakpoint change, so
       a window dragged across 1024px ends up on the right one
       rather than on whichever it loaded with.
    --------------------------------------------------------- */
    var section = list.closest('.section--process');

    /* THE SAME QUERY THE PINNED LAYOUT IS GATED ON IN styles.css,
       and it has to stay the same. The height half is not padding:
       under 720px of window the stylesheet drops the pin and puts
       the section back into its one-column form, and a progress
       driver pointed at a section that is not pinned lights the
       wrong amenity. See the note above the pinned block there.

       720 and not 680 since the intro was capped at 430px and went
       back to five lines — the note in styles.css carries the
       re-measured numbers.

       `wide` itself is declared at the top of this block; see the
       note there for why it could not live here. */
    var watcher = null;
    var ticking = false;

    /* The track's length has to match the number of amenities, and
       the stylesheet cannot count them — so it carries a hardcoded
       4 for the first paint and this corrects it from the markup.
       Set unconditionally rather than only when wide: the property
       is inert at narrow widths, and setting it here means a window
       widened past 1024px already has the right value instead of
       waiting for a scroll. */
    if (section) section.style.setProperty('--process-count', steps.length);

    /* Where the pin is in its travel, 0 to 1, and which of the
       equal slices of that travel we are standing in.

       -rect.top rather than a scrollY sum, because the rect is
       measured against the viewport and so already accounts for
       every header, banner and zoom level above it. travel is the
       distance the sticky frame can move inside the section: the
       section's height less the one screen the frame occupies.

       The guard is not paranoia. If the section is ever shorter
       than the screen the divisor is zero or negative, and the
       whole expression turns into NaN or a sign flip — which
       would leave the deck stuck on whichever card it happened
       to compute. Leaving the state alone is the right failure. */
    function readProgress() {
      if (!section) return;
      var rect   = section.getBoundingClientRect();
      var travel = rect.height - window.innerHeight;
      if (travel <= 0) return;
      var p = -rect.top / travel;
      if (p < 0) p = 0; else if (p > 1) p = 1;
      var i = Math.floor(p * steps.length);
      if (i > steps.length - 1) i = steps.length - 1;   /* p === 1 lands off the end */
      if (steps[i] !== current) show(steps[i]);
    }

    /* One read per frame at most. A scroll event can fire many
       times between paints, and getBoundingClientRect forces a
       layout flush every time it is called — unthrottled this is
       the shape that makes a pinned section stutter. */
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; readProgress(); });
    }

    function bind() {
      window.removeEventListener('scroll', onScroll);
      if (watcher) { watcher.disconnect(); watcher = null; }

      if (wide.matches && section) {
        /* A description opened by a tap before the window was
           widened is still open up here, possibly on a step that is
           not the active one — and the pinned layout has no way to
           close it, because the thing it was opened with is the
           photograph and the photograph is gone. Clear it and let
           show() re-assert, since at this width show() is what owns
           the open state. */
        steps.forEach(function (s) { s.classList.remove('is-open'); });
        if (current) show(current);

        window.addEventListener('scroll', onScroll, { passive: true });
        readProgress();
        return;
      }

      if (!('IntersectionObserver' in window)) return;
      watcher = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) show(entry.target);
        });
      }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
      steps.forEach(function (step) { watcher.observe(step); });
    }

    bind();

    /* --- GO TO AN AMENITY -----------------------------------
       Shared by the two things that can ask for it: the amenity's
       own row, and its dot in the rail beside the deck. It takes
       any element carrying a data-step and finds the step of that
       number, so neither caller needs to know its own position.

       There is nothing to "select" here — show() is driven by
       readProgress and would immediately overwrite anything set
       directly — so the click does the one thing that lasts: it
       moves the page to where that amenity is up, and the driver
       lights it on the way.

       THE ARITHMETIC IS readProgress' RUN BACKWARDS, which is why
       it is worth reading the two together. That function takes
       -rect.top over the travel to get p, then floor(p * n) for
       the index; this takes an index and returns a scroll position
       whose p lands in the MIDDLE of that index's slice —
       (i + 0.5) / n. The middle and not the start on purpose: a
       position on a slice boundary is one rounded pixel away from
       lighting its neighbour, and half a slice of margin either
       side is what makes the dot you pressed the dot that lights.

       pageYOffset rather than a rect-only sum because scrollTo
       wants a document coordinate and rect.top is a viewport one.

       The wide.matches guard is NOT belt and braces for the row —
       that button exists at both widths and does something else
       entirely on a phone, so this has to refuse to run there. The
       driver below the breakpoint is an IntersectionObserver over
       steps that scroll normally, and this arithmetic is
       meaningless against it. (For the dots it is belt and braces:
       their rail is display: none down there.)

       An explicit 'smooth' would win over the reduced motion rule
       in _template.css, which only reaches the CSS scroll-behavior
       property, so the check is here — the same one and for the
       same reason as the review rail's arrows above. And it is a
       feature test as well as a preference test: the options form
       of scrollTo is ignored wholesale by a browser that does not
       take it, which would leave the dots dead rather than abrupt. */
    function goToStep(el) {
      if (!section || !wide.matches) return;

      var want = el.getAttribute('data-step');
      var i = -1;
      steps.forEach(function (step, n) {
        if (step.getAttribute('data-step') === want) i = n;
      });
      if (i === -1) return;

      var rect   = section.getBoundingClientRect();
      var travel = rect.height - window.innerHeight;
      if (travel <= 0) return;

      var top = Math.round(
        rect.top + window.pageYOffset + ((i + 0.5) / steps.length) * travel
      );

      if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({ top: top, behavior: stillMotion.matches ? 'auto' : 'smooth' });
      } else {
        window.scrollTo(0, top);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () { goToStep(dot); });
    });

    /* addListener is the pre-2019 spelling and Safari needed it
       until 14. Cheap to keep, and the fallback for not having it
       is a section that silently stops updating on a resize. */
    if (wide.addEventListener) wide.addEventListener('change', bind);
    else if (wide.addListener) wide.addListener(bind);

    /* A resize changes innerHeight, which changes the travel the
       progress is a fraction of. Only the wide driver cares; the
       observer recomputes its own margins. */
    window.addEventListener('resize', onScroll);
  });

  /* --- SCROLL REVEAL -----------------------------------------
     Brings each block in as you reach it, once.

     Nothing here decides WHETHER the page animates. The inline
     script in <head> did that before first paint — it is the one
     that adds .reveal-on, and it applies the same two tests this
     file would (an IntersectionObserver exists, and the visitor
     has not asked for less motion). It has to run up there
     because the hidden state has to be in place before the
     browser paints, or the page shows a section, hides it, and
     shows it again. So the check below is `is the gate open`,
     not `should it be`.

     Two shapes in the markup:

       [data-reveal]        one element, watched on its own.
       [data-reveal-group]  a parent. Its direct children come in
                            one after another off the parent's
                            own arrival — which is the point for
                            a card rail, where the cards off the
                            right edge of the screen never
                            intersect the viewport at all and
                            would otherwise sit at opacity 0
                            until somebody swiped them into view.

     The group's value is the default style for its children
     ("", "settle" or "fade"); a child carrying its own
     data-reveal keeps it. See the note in styles.css for what
     the three do and why a rail card must not translate.
  ------------------------------------------------------------ */
  if (document.documentElement.classList.contains('reveal-on')) {

    var arriving;                 /* the observer, set up below */
    var pending  = [];            /* everything still waiting    */

    function watch(el) {
      if (pending.indexOf(el) > -1) return;
      pending.push(el);
      arriving.observe(el);
    }

    function done(el) {
      arriving.unobserve(el);
      var at = pending.indexOf(el);
      if (at > -1) pending.splice(at, 1);
    }

    function revealNow(el) {
      if (el.hasAttribute('data-reveal-group')) {
        Array.prototype.forEach.call(el.children, function (kid) {
          kid.classList.add('is-revealed');
          done(kid);
        });
      }
      el.classList.add('is-revealed');
      done(el);
    }

    arriving = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { revealNow(entry.target); return; }

        var box = entry.boundingClientRect;

        /* No box at all. display: none at this width (the rail
           arrows on a phone) or display: contents (the amenity
           column on a phone, which hands its children straight to
           the grid and keeps no box of its own). Neither will
           ever intersect anything, so an observer alone would
           leave them at opacity 0 for good — and the arrows would
           then appear blank the moment the window widened past
           the breakpoint that hides them. There is nothing on
           screen to animate, so let them through.

           A display: contents GROUP is let through the same way,
           and that is why every child is observed individually as
           well: the group's stagger is gone at that width, but
           each child still arrives on its own as it reaches the
           screen, which on a phone is what the stagger was
           standing in for anyway. */
        if (box.width === 0 && box.height === 0) { revealNow(entry.target); return; }

        /* Above the top of the screen already. A reload partway
           down the page restores the scroll position before this
           runs, so a block's moment can be over before it was
           ever watched. Show it rather than leave it hidden. */
        if (box.bottom < 0) revealNow(entry.target);
      });
    }, {
      /* Ten percent of the viewport trimmed off the bottom edge,
         so a block starts moving once it is properly on screen
         rather than the instant its first pixel clears the fold —
         which lands the movement under the eye instead of at the
         very bottom of it. */
      rootMargin: '0px 0px -10% 0px',
      threshold: 0
    });

    /* Groups and their children both, and the children are not
       redundant. Where the group has a box it fires first and
       hands its children the stagger, and their own entries
       arrive to find them already revealed and unobserved. Where
       it has none — the amenity column is display: contents on a
       phone, which gives its children straight to the grid and
       keeps no box of its own — the group never intersects
       anything, and watching each child is the only thing
       standing between that section and a permanent opacity of
       zero. */
    document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
      Array.prototype.forEach.call(group.children, watch);
      watch(group);
    });
    document.querySelectorAll('[data-reveal]').forEach(watch);

    /* The one thing an observer cannot see: a jump. An anchor or
       a restored scroll position moves the page in a single frame,
       and anything skipped over goes from "not intersecting,
       below" to "not intersecting, above" without its ratio ever
       leaving zero — so no callback fires and the block stays
       hidden above the fold forever. Sweeping on scroll catches
       it. One rect read per pending element per frame, and the
       listener takes itself off as soon as the page has finished
       arriving. */
    function sweep() {
      pending.slice().forEach(function (el) {
        if (el.getBoundingClientRect().bottom < 0) revealNow(el);
      });
      if (!pending.length) window.removeEventListener('scroll', onScroll);
    }

    var queued = false;
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; sweep(); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* A keyboard user can reach a card before the observer has.
       Focus scrolls it into view and the observer catches up a
       frame later, but a frame of a visible focus ring around
       nothing is still a frame too many — and a control inside a
       hidden block is reachable whether or not it is drawn.
       Whatever takes focus, show it and everything it sits in. */
    document.addEventListener('focusin', function (e) {
      var box = e.target.closest && e.target.closest('[data-reveal], [data-reveal-group]');
      while (box) {
        revealNow(box);
        box = box.parentElement
          && box.parentElement.closest('[data-reveal], [data-reveal-group]');
      }
    });
  }

  /* --- COPY TO CLIPBOARD -------------------------------------
     The Copy button beside the discount code on welcome.html.

     PROGRESSIVE, AND IT HAS TO BE. The code is real selectable
     text in the markup with user-select: all on it, so a click
     already takes the whole thing; this button is the convenience
     on top. If the script never arrives the button is hidden
     below and nothing is lost.

     TWO PATHS, because one of them is not always there.
     navigator.clipboard exists only in a secure context, so it is
     present on https and on localhost and absent the moment
     somebody opens this file straight off disk with file:// — which
     is exactly how a client previews a page. The execCommand
     fallback is deprecated and still the only thing that works
     there. It needs a real element in the document with a real
     selection, hence the off-screen textarea; readonly stops iOS
     throwing the keyboard up over the page as it focuses.

     The confirmation goes in the [data-copy-status] paragraph,
     which is role="status" in the markup — a polite live region,
     so it is announced as well as shown. The button's own label
     does NOT change: relabelling the control a screen reader has
     just moved focus to is how you get "Copied" read out as the
     name of a button that now appears to do something else.
  ------------------------------------------------------------ */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var code   = btn.getAttribute('data-code') || '';
    var status = document.querySelector('[data-copy-status]');
    var clear;

    if (!code) return;

    /* Shown by the script, so a no-JavaScript visitor never sees a
       button that cannot do anything. */
    btn.hidden = false;

    function say(message) {
      if (!status) return;
      /* Cleared first. Writing the same string into a live region
         twice announces nothing the second time, and the second
         time is exactly when a visitor is checking it worked. */
      status.textContent = '';
      window.setTimeout(function () { status.textContent = message; }, 40);
      window.clearTimeout(clear);
      clear = window.setTimeout(function () { status.textContent = ''; }, 4000);
    }

    function theOldWay() {
      var pad = document.createElement('textarea');
      pad.value = code;
      pad.setAttribute('readonly', '');
      pad.style.position = 'fixed';
      pad.style.top = '-1000px';
      pad.style.opacity = '0';
      document.body.appendChild(pad);
      pad.select();
      pad.setSelectionRange(0, code.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(pad);
      return ok;
    }

    btn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () {
          say('Copied ' + code + ' to your clipboard.');
        }, function () {
          say(theOldWay() ? 'Copied ' + code + ' to your clipboard.'
                          : 'Copy that didn\u2019t work \u2014 the code is ' + code + '.');
        });
        return;
      }
      say(theOldWay() ? 'Copied ' + code + ' to your clipboard.'
                      : 'Copy that didn\u2019t work \u2014 the code is ' + code + '.');
    });
  });

  /* --- EMAIL FORMS -------------------------------------------
     While action="[FORM ACTION URL]" is still a placeholder the
     form can't submit anywhere, so this shows a reminder instead
     of silently reloading the page. Once you paste in a real
     form URL, this check steps out of the way.
  ------------------------------------------------------------ */
  document.querySelectorAll('.offer-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var action = form.getAttribute('action') || '';
      if (action.indexOf('[') === 0) {
        e.preventDefault();
        alert('This form has no destination yet.\n\nOpen index.html and replace [FORM ACTION URL] with your form or funnel URL.');
      }
    });
  });
})();
