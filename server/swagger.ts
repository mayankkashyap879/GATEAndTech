import swaggerJsdoc from 'swagger-jsdoc';
import type { OAS3Options } from 'swagger-jsdoc';

const options: OAS3Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GATE And Tech API',
      version: '1.0.0',
      description: 'Comprehensive GATE exam preparation platform API documentation',
      contact: {
        name: 'API Support',
        email: 'support@gateandtech.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.APP_URL || 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.gateandtech.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { 
              type: 'string',
              enum: ['student', 'moderator', 'admin'],
            },
            theme: {
              type: 'string',
              enum: ['light', 'dark', 'system'],
            },
            twofaEnabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Question: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            content: { type: 'string' },
            type: {
              type: 'string',
              enum: ['mcq_single', 'mcq_multiple', 'numerical'],
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
            },
            options: { type: 'array', items: { type: 'object' } },
            marks: { type: 'integer' },
            negativeMarks: { type: 'integer' },
            isPublished: { type: 'boolean' },
          },
        },
        Test: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            duration: { type: 'integer', description: 'Duration in minutes' },
            totalMarks: { type: 'integer' },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived'],
            },
            isPro: { type: 'boolean' },
            scheduledAt: { type: 'string', format: 'date-time' },
          },
        },
        TestAttempt: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            testId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            status: {
              type: 'string',
              enum: ['in_progress', 'processing', 'submitted', 'evaluated'],
            },
            score: { type: 'integer', nullable: true },
            maxScore: { type: 'integer', nullable: true },
            percentile: { type: 'integer', nullable: true },
            startedAt: { type: 'string', format: 'date-time' },
            submittedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'object', nullable: true },
          },
        },
        Success: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            data: { type: 'object', nullable: true },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Authentication required' },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Insufficient permissions' },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Resource not found' },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { 
                error: 'Validation failed',
                details: { field: 'email', message: 'Invalid email format' }
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Questions', description: 'Question bank management' },
      { name: 'Tests', description: 'Test creation and management' },
      { name: 'Attempts', description: 'Test attempt operations' },
      { name: 'Analytics', description: 'Performance analytics and reporting' },
      { name: 'Payments', description: 'Payment and purchase operations' },
      { name: 'Discussions', description: 'Community discussions and forums' },
      { name: 'Roles', description: 'Role and permission management' },
      { name: 'Notifications', description: 'Notification management' },
      { name: 'Admin', description: 'Administrative operations' },
    ],
  },
  apis: [
    './server/routes/*.ts',
    './server/routes/*.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
