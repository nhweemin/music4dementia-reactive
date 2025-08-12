export default async function playlistRoutes(fastify, options) {
  // Create placeholder routes for playlists
  fastify.get('/', async (request, reply) => {
    reply.send({ message: 'Playlists endpoint - implementation pending' });
  });
}
