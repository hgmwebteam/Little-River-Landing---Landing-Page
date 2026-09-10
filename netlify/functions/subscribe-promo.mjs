// /promo — TikTok traffic.
import { subscribeToGhl } from '../lib/ghlSubscribe.mjs';

const TAG = 'tiktok-ai-landing-page';

export default (request) => subscribeToGhl(request, TAG);

export const config = { path: '/api/subscribe/promo', method: 'POST' };
