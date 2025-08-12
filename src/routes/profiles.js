export default async function profileRoutes(fastify, options) {
  // Create placeholder routes for profiles
  fastify.get('/', async (request, reply) => {
    reply.send({ message: 'Profiles endpoint - implementation pending' });
  });
}
