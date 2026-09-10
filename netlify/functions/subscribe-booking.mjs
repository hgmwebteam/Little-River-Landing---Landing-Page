// /booking — Meta traffic.
import { subscribeToGhl } from '../lib/ghlSubscribe.mjs';

const TAG = 'meta-ai-landing-page';

export default (request) => subscribeToGhl(request, TAG);

export const config = { path: '/api/subscribe/booking', method: 'POST' };
