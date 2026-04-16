// For Node.js, ensure "type": "module" in package.json
// (Not required for Bun)
import { Elysia } from 'elysia';
 
const app = new Elysia().get('/', () => ({
  message: 'Hello from Elysia on Vercel!',
}));
 
// Export the Elysia app
export default app;