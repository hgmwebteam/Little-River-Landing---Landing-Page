// /signupnow — Facebook traffic.
import { subscribeToGhl } from '../lib/ghlSubscribe.mjs';

const TAG = 'facebook-ai-landing-page';

export default (request) => subscribeToGhl(request, TAG);

export const config = { path: '/api/subscribe/signupnow', method: 'POST' };
