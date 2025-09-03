import { onRequest } from 'firebase-functions/v2/https';

export const ssr = onRequest({ region: 'us-central1' }, async (req, res) => {
  // @ts-ignore - importing compiled Angular SSR server
  const { reqHandler } = await import('../../dist/LocalGoogleCalendarLinkMaker/server/server.mjs');
  return reqHandler(req, res);
});