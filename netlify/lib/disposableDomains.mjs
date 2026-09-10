/* Throwaway / disposable email domains the signup functions refuse.

   Kept as a plain inline Set because this repo has no package.json and
   no build step, so there is nothing to pull a maintained list from.
   These are the services that show up most in junk signups. Add a line
   when a new one starts appearing in GHL; match is on the registrable
   domain, so `anything.mailinator.com` is caught by `mailinator.com`. */

export const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', '10minemail.com', '20minutemail.com',
  '33mail.com', 'anonaddy.me', 'anonbox.net', 'binkmail.com', 'bobmail.info',
  'burnermail.io', 'byom.de', 'chacuo.net', 'crazymailing.com', 'deadaddress.com',
  'discard.email', 'dispostable.com', 'dropmail.me', 'emailondeck.com',
  'emailtemporario.com.br', 'fakeinbox.com', 'fakemail.net', 'filzmail.com',
  'getairmail.com', 'getnada.com', 'guerrillamail.com', 'guerrillamail.net',
  'guerrillamail.org', 'guerrillamailblock.com', 'harakirimail.com', 'inboxbear.com',
  'inboxkitten.com', 'incognitomail.org', 'jetable.org', 'koszmail.pl',
  'kuku.lu', 'linshiyouxiang.net', 'mail-temp.com', 'mailcatch.com',
  'maildrop.cc', 'maildu.de', 'mailexpire.com', 'mailinator.com', 'mailinator.net',
  'mailnesia.com', 'mailnull.com', 'mailsac.com', 'mailtemp.info', 'meltmail.com',
  'mintemail.com', 'mohmal.com', 'moakt.com', 'mytemp.email', 'nada.email',
  'nowmymail.com', 'objectmail.com', 'owlpic.com', 'pokemail.net', 'proxymail.eu',
  'rcpt.at', 'sharklasers.com', 'spam4.me', 'spamgourmet.com', 'spambox.us',
  'spamex.com', 'spamfree24.org', 'temp-mail.io', 'temp-mail.org', 'tempail.com',
  'tempinbox.com', 'tempmail.com', 'tempmail.net', 'tempmailo.com', 'tempmailaddress.com',
  'tempr.email', 'throwawaymail.com', 'tmail.ws', 'tmpmail.net', 'tmpmail.org',
  'trash-mail.com', 'trashmail.com', 'trashmail.me', 'trashmail.net', 'wegwerfmail.de',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'zetmail.com',
]);

/** True if the domain, or any parent of it, is on the list. */
export function isDisposableDomain(domain) {
  const parts = domain.toLowerCase().split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    if (DISPOSABLE_DOMAINS.has(parts.slice(i).join('.'))) return true;
  }
  return false;
}
