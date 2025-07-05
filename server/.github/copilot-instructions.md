# Development Guidelines for Brev-ly

This document provides essential information for developers working on the Brev-ly project.

## Build/Configuration Instructions

### Prerequisites
- Node.js (LTS version recommended)
- pnpm package manager
- PostgreSQL database

### Environment Setup
1. Copy the `.env.example` file to `.env` and fill in the required values:
   ```
   PORT=3000
   HOST=0.0.0.0
   NODE_ENV=development

   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/brev-ly"

   # CLOUDFLARE R2 (for file storage)
   CLOUDFLARE_R2_ACCOUNT_ID=""
   CLOUDFLARE_R2_ACCESS_KEY_ID=""
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=""
   CLOUDFLARE_R2_BUCKET=""
   CLOUDFLARE_R2_PUBLIC_URL=""
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development
Start the development server with hot reloading:
```bash
pnpm dev
```

### Building for Production
1. Clean the build directory:
   ```bash
   pnpm clean
   ```

2. Build the project:
   ```bash
   pnpm build
   ```

3. Start the production server:
   ```bash
   pnpm start
   ```

### Docker
The project includes Docker configuration for containerized deployment:

1. Build the Docker image:
   ```bash
   docker build -t brev-ly .
   ```

2. Run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

## Database Management

The project uses Drizzle ORM for database operations:

1. Generate database migrations:
   ```bash
   pnpm db:generate
   ```

2. Apply migrations:
   ```bash
   pnpm db:migrate
   ```

3. Open Drizzle Studio for database management:
   ```bash
   pnpm db:studio
   ```

## Testing Information

### Running Tests
The project uses Vitest for testing. Run tests with:

```bash
pnpm test
```

For test coverage reports:

```bash
pnpm test:coverage
```

### Adding New Tests

1. Create test files with the `.test.ts` extension in the appropriate directory.
2. For API endpoint tests, use Fastify's `inject()` method to make requests:

```typescript
import { describe, it, expect } from 'vitest';
import { app } from '@/app.js';

describe('Feature Name', () => {
  it('should do something specific', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/your-endpoint',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(/* expected response */);
  });
});
```

3. For testing with environment variables, use the `.env.testing` file.

## Features and Rules
- [x]  It should be possible to create a link
    - [x]  It should not be possible to create a link with a malformed shortened URL
    - [x]  It should not be possible to create a link with an already existing shortened URL
- [ ]  It should be possible to delete a link
- [ ]  It should be possible to obtain the original URL through a shortened URL
- [ ]  It should be possible to list all registered URLs
- [ ]  It should be possible to increment the access count of a link
- [ ]  It should be possible to export the created links in a CSV
    - [ ]  It should be possible to access the CSV through a CDN (Amazon S3, Cloudflare R2, etc)
    - [ ]  A random and unique name should be generated for the file
    - [ ]  It should be possible to perform the listing in a performant way
    - [ ]  The CSV should have fields such as original URL, shortened URL, access count, and creation date.

## Code Style and Development Practices
This project follows a set of coding standards and practices to ensure maintainability and readability:
Also use MVC architecture for structuring the codebase.

### Code Style
- Use TypeScript for all new code
- Follow the Airbnb JavaScript Style Guide
- Use JSDoc comments for public functions and classes
- Use meaningful variable and function names
- Avoid global variables
- Use `const` and `let` instead of `var`
- Use arrow functions for callbacks and methods
- Use template literals for string concatenation
- Use destructuring for objects and arrays where appropriate
- Use async/await for asynchronous code
- Use `try/catch` for error handling in asynchronous functions
- Use `import` statements for module imports
- Use `export` statements for module exports
- Use `interface` for defining types and shapes of objects
- Use `enum` for defining enumerated types
- Use `type` for defining type aliases
- Use `@ts-ignore` sparingly and only when absolutely necessary
- Use `@deprecated` for deprecated functions and methods
- Use `@todo` for TODO comments
- Use `@fixme` for FIXME comments

### MVC Architecture
The project follows the Model-View-Controller (MVC) architecture:
- **Model**: Represents the data and business logic (e.g., database models, services)
- **View**: Represents the user interface (e.g., API responses, HTML templates)
- **Controller**: Handles user input and interacts with the model to produce a response (e.g., route handlers)
- Controllers should be thin and delegate business logic to services.
- Services should handle complex business logic and interact with models.
- Models should represent the data structure and database interactions.
- Views should be responsible for formatting the output, such as JSON responses or HTML pages.
- Use dependency injection to manage dependencies between controllers, services, and models.
- Use interfaces to define contracts for services and models, allowing for easier testing and mocking.
- Use decorators for validation and transformation of input data, such as Zod schemas for request validation.
- Use middleware for cross-cutting concerns like authentication, logging, and error handling.
- Use repositories for data access, encapsulating database queries and operations.
- Use DTOs (Data Transfer Objects) for transferring data between layers, ensuring type safety and validation.
- Use factories for creating instances of models or services, allowing for easier testing and mocking.

### Testing Practices
- Write unit tests for individual functions and methods.
- Write integration tests for API endpoints and service interactions.
- Use mocking libraries to isolate tests and avoid dependencies on external services.
- Use fixtures for setting up test data.
- Use test doubles (mocks, stubs, spies) to simulate dependencies in tests.
- Use snapshot testing for API responses to ensure consistency.
- Use test coverage tools to ensure sufficient test coverage across the codebase.
- Use environment variables to configure tests, such as database connections and API keys.
- Use the `.env.testing` file for test-specific environment variables.
- Use FIRST for writing tests, ensuring that new features are covered by tests before implementation.

### Code Formatting and Linting
The project uses Biome for code formatting and linting with the following configuration:

- Indentation: 4 spaces
- Line width: 80 characters
- Quotes: Single quotes for JavaScript, double quotes for JSX
- Semicolons: Required
- Trailing commas: Required

### TypeScript Configuration
- The project uses strict TypeScript settings
- Path aliases are configured with `@/*` pointing to `./src/*`
- ES modules are used throughout the project

### API Documentation
API documentation is available through Swagger UI when the application is running:

```
http://localhost:PORT/docs
```

### Error Handling
- Use the built-in error handler for consistent error responses
- Validation errors are automatically handled by the Zod integration

### Project Structure
- `src/app.ts` - Main application setup
- `src/server.ts` - Server entry point
- `src/env/` - Environment configuration
- `src/tests/` - Test files
