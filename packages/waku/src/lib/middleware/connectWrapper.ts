import type { IncomingMessage, ServerResponse } from 'node:http';

import type { BaseReq, BaseRes, Middleware } from './types.js';

export function connectWrapper(
  m: Middleware<
    BaseReq & { orig: IncomingMessage },
    BaseRes & { orig: ServerResponse }
  >,
) {
  return async (
    connectReq: IncomingMessage,
    connectRes: ServerResponse,
    next: (err?: unknown) => void,
  ) => {
    const { Readable, Writable } = await import('node:stream');
    const req: BaseReq & { orig: IncomingMessage } = {
      stream: Readable.toWeb(connectReq) as any,
      method: connectReq.method || '',
      url: new URL(
        connectReq.url || '',
        `http://${connectReq.headers.host}`,
      ).toString(),
      headers: connectReq.headers,
      orig: connectReq,
    };
    const res: BaseRes & { orig: ServerResponse } = {
      stream: Writable.toWeb(connectRes),
      setStatus: (code) => (connectRes.statusCode = code),
      setHeader: (name, value) => connectRes.setHeader(name, value),
      orig: connectRes,
    };
    m(req, res, next);
  };
}