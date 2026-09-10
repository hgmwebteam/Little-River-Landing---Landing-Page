// Default route — used by index.html and booknow.html.
import { subscribeToGhl } from '../lib/ghlSubscribe.mjs';

const TAG = 'instagram-ai-landing-page';

export default (request) => subscribeToGhl(request, TAG);

export const config = { path: '/api/subscribe', method: 'POST' };
