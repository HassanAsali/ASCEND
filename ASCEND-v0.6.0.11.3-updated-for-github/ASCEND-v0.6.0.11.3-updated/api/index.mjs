import { requestHandler } from '../server.mjs';

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const route = String(req.query?.route || url.searchParams.get('route') || '').replace(/^\/+/, '');
  const params = new URLSearchParams(url.search);
  params.delete('route');
  const qs = params.toString();
  req.url = `/api/${route}${qs ? `?${qs}` : ''}`;
  return requestHandler(req, res);
}
