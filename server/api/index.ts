import server from '../src/app';

export default async function handler(req: any, res: any) {
    await server.ready();
    server.server.emit('request', req, res);
}
