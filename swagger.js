import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
    },
    servers: [
      {
        url: `https://scripta-app-be-production.up.railway.app`, // hoặc ngrok url
      },
    ],
  },
  apis: ['./server.js'], // file chứa route có comment swagger
};

const specs = swaggerJsDoc(options);

export default function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

