/* GoHighLevel (LeadConnector) contact upsert — shared by every
   /api/subscribe* function in ../functions.

   This file lives OUTSIDE netlify/functions on purpose: Netlify treats
   every top-level file in that folder as an endpoint, and this is a
   library, not a route. The functions import it by relative path and
   Netlify's bundler folds it in at deploy time.

   Runs on Netlify Functions (Node 18+), so `fetch`, `Request` and
   `Response` are the web-standard globals. Nothing here is installed. */

import { promises as dns } from 'node:dns';
import { isDisposableDomain } from './disposableDomains.mjs';

const GHL_UPSERT_URL = 'https://services.leadconnectorhq.com/contacts/upsert';
const GHL_API_VERSION = '2021-07-28';

/* Shape check. Mirrored in script.js so an obviously bad address is
   refused in the browser before a request is made. Requires a dotted
   domain ending in a 2+ letter TLD, which is what rules out `a@b`. */
const EMAIL_RE = /^[^\s@]+@([a-z0-9-]+\.)+[a-z]{2,}$/i;
const EMAIL_MAX = 254;
const DNS_TIMEOUT_MS = 2000;

/* DNS answers that mean "this name does not exist / has no such
   record". Anything else (SERVFAIL, timeout, refused) is the resolver
   having a bad moment, not proof the address is fake. */
const DNS_NEGATIVE = new Set(['ENOTFOUND', 'ENODATA']);

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error('DNS lookup timed out');
      err.code = 'ETIMEOUT';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Can this domain receive mail?
 *   'yes'     MX record, or an A/AAAA record (RFC 5321 fallback).
 *   'no'      every lookup came back "no such name".
 *   'unknown' the resolver failed or was slow — fail open.
 */
async function domainAcceptsMail(domain) {
  const lookups = [
    () => dns.resolveMx(domain),
    () => dns.resolve4(domain),
    () => dns.resolve6(domain),
  ];
  let sawNegative = false;
  for (const lookup of lookups) {
    try {
      const records = await withTimeout(lookup(), DNS_TIMEOUT_MS);
      if (records && records.length) return 'yes';
    } catch (err) {
      if (DNS_NEGATIVE.has(err?.code)) { sawNegative = true; continue; }
      return 'unknown';
    }
  }
  return sawNegative ? 'no' : 'unknown';
}

/**
 * Run the three checks. Returns the normalised address, or null when
 * the address should be refused. DNS trouble is logged and let through.
 */
async function validateEmail(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > EMAIL_MAX || !EMAIL_RE.test(trimmed)) return null;

  const at = trimmed.lastIndexOf('@');
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();
  const email = local + '@' + domain;

  if (isDisposableDomain(domain)) return null;

  const verdict = await domainAcceptsMail(domain);
  if (verdict === 'no') return null;
  if (verdict === 'unknown') console.warn('[subscribe] DNS check skipped for', domain);

  return email;
}

/**
 * Upsert the submitted email into the GHL sub-account and apply one tag.
 *
 * @param {Request} request  The incoming POST. Body: `{ "email": "..." }`.
 * @param {string}  tag      Campaign tag. Fixed per route, so the browser
 *                           cannot choose its own attribution.
 * @returns {Promise<Response>}
 */
export async function subscribeToGhl(request, tag) {
  // Names match what is already in .env. On Netlify, set the same two in
  // Site configuration → Environment variables. The token must be a
  // private integration token from the SAME sub-account as the location
  // ID, or GHL answers 401.
  const token = (process.env.GHL_API_KEY || '').trim();
  const locationId = (process.env.GHL_LOCATION_ID || '').trim();

  if (!token || !locationId) {
    console.error('[subscribe] Missing GHL_API_KEY and/or GHL_LOCATION_ID env vars');
    return Response.json({ error: 'Signup is not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Shape, throwaway domain, and "can this domain receive mail". A 400
  // here is the ONE answer the browser treats as final: it shows the
  // inline error and keeps the visitor on the page. Every other failure
  // still sends them on to welcome.html.
  const email = await validateEmail(body?.email);
  if (!email) {
    return Response.json({ error: 'invalid_email' }, { status: 400 });
  }

  // Upsert, not create: a repeat submitter merges into their existing
  // contact and picks up the new tag instead of a duplicate-contact error.
  let res;
  try {
    res = await fetch(GHL_UPSERT_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        Version: GHL_API_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, locationId, tags: [tag], source: tag }),
    });
  } catch (err) {
    console.error('[subscribe] GHL upsert request failed', err);
    return Response.json({ error: 'Signup failed' }, { status: 502 });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[subscribe] GHL upsert failed', res.status, text);
    return Response.json({ error: 'Signup failed' }, { status: 502 });
  }

  return Response.json({ ok: true });
}
