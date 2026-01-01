import server from './app';
import { connectDB } from './db';

const start = async () => {
    try {
        await connectDB();
        await server.listen({ port: 3001, host: '0.0.0.0' });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
