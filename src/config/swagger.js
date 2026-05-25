const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PetBuddy API',
      version: '1.0.0',
      description: 'Official API documentation for the PetBuddy backend services, including Admin Authentication and Portal features.',
    },
    servers: [
      {
        url: 'http://localhost:3000', // Update this based on the active port in process.env.PORT
        description: 'Development server',
      },
    ],
  },
  // Paths to files containing OpenAPI definitions
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
