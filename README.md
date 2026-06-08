<div align="center">
  <h1>DevForge (design-backend-app)</h1>
  <p><strong>The Intelligent Backend Architecture Generator</strong></p>
  <p>Build less boilerplate. Focus on business logic. Generate scalable architecture from day one.</p>

  [![npm version](https://img.shields.io/npm/v/design-backend-app.svg)](https://www.npmjs.com/package/design-backend-app)
  [![License](https://img.shields.io/npm/l/design-backend-app.svg)](https://github.com/your-username/design-backend-app/blob/main/LICENSE)
</div>

<hr />

## What is DevForge?

**DevForge (`design-backend-app`)** is a powerful CLI tool designed to completely automate the setup and scaling of robust Node.js backend applications. Whether you are building a small MVP or an enterprise-grade microservice architecture, DevForge generates the exact boilerplate, configurations, and structures you need.

Stop configuring Express, Fastify, TypeScript, ORMs, and Swagger manually. Run one command, answer a few prompts, and start coding your business logic immediately.

---

## ✨ Features

- 🏗 **Dynamic Architecture Options**: Choose between MVC or Modular scale-based architectures (Small, Medium, Enterprise).
- 🚀 **Framework Agnostic**: Native support for **Express.js** and **Fastify** (with Hono and NestJS coming soon).
- 💾 **Database & ORMs**: Out-of-the-box integration with **Mongoose**, **Prisma**, and **Sequelize**.
- 🔐 **Robust Authentication**: Automated JWT or Session-based Auth flows complete with Role-Based Access Control (RBAC) and bcrypt hashing.
- 🧩 **Pluggable Ecosystem**: Instantly add or remove features like **Swagger**, **Redis**, **Docker**, **BullMQ**, and more via the CLI.
- 📜 **API Documentation**: Automated OpenAPI/Swagger generation with deeply integrated code comments and route tagging.
- ⚡ **Code Generation**: Scaffolding commands for modules (with full CRUD models), auth systems, queues, and upload services.

---

## 📦 Getting Started

### Creating a New Project

You can create a new project instantly using `npx` (no installation required):

```bash
npx design-backend-app my-backend
```
*Or use the `init` command:*
```bash
npx design-backend-app init my-backend
```

### The Setup Wizard
The CLI will walk you through an interactive setup:
1. **Framework**: `Express.js` or `Fastify`
2. **Language**: `TypeScript` (JavaScript coming soon)
3. **Architecture**: `MVC` (Classic) or `Modular` (Domain-Driven)
4. **Scale** (if Modular): `Small`, `Medium`, or `Enterprise`
5. **Database**: `MongoDB (Mongoose)`, `PostgreSQL (Prisma)`, `MySQL (Sequelize)`, or `None`
6. **Authentication**: `JWT`, `Session`, or `None`
7. **RBAC**: Do you need Role-Based Access Control? (Define custom roles like user, admin, superadmin)

Once finished, `cd` into your project and start the development server:
```bash
cd my-backend
npm run dev
```

---

## 🛠 Command Line Interface (CLI)

DevForge installs itself locally into your generated project. You can run CLI commands from within your project directory using `npx design-backend-app <command>`.

### 1. `generate` (or `g`)
Quickly scaffold new features, endpoints, and database models.

```bash
# Generate a complete Authentication flow (Register, Login, Logout)
npx design-backend-app generate auth

# Generate a new module
npx design-backend-app generate module inventory

# Generate a module with full Database Models, CRUD Controllers, and Routes
npx design-backend-app generate module users --crud

# Generate a Message Queue worker
npx design-backend-app generate queue emails

# Generate an Upload service
npx design-backend-app generate upload documents
```

> **Note**: When running `--crud`, DevForge strictly aligns the generated model code with your selected ORM (Prisma, Mongoose, or Sequelize).

### 2. `add <plugin>`
Instantly inject complex plugins, middleware, and configuration files into your existing codebase.

```bash
npx design-backend-app add swagger
```

**Available Plugins:**
- `swagger` - Automated OpenAPI documentation (UI available at `/api-docs`)
- `docker` - Generates highly-optimized `Dockerfile` and `docker-compose.yml`
- `redis` - Integrates Redis caching layer
- `bullmq` - Adds robust background job processing
- `logger` - Advanced Winston/Pino logging setup
- `rate-limit` - Express/Fastify API rate limiting
- `validation` - Zod request validation middleware
- `aws-s3` - Amazon S3 upload configurations
- `nodemailer` - Email templating and dispatching
- `code-quality` - Pre-configured ESLint, Prettier, and Husky hooks

### 3. `remove <plugin>`
Safely strip out a plugin, its middleware integrations, and configuration files if you no longer need it.

```bash
npx design-backend-app remove swagger
```

---

## 🗂 Architecture Patterns

### MVC (Model-View-Controller)
Perfect for standard, straightforward web applications.
```text
src/
├── controllers/    # Request handlers
├── models/         # Database schemas
├── routes/         # Express/Fastify routers
├── middleware/     # Custom middleware
└── app.ts          # Application entry point
```

### Modular (Domain-Driven)
Designed for scalability and microservice readiness. Code is grouped by business domain.
```text
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.routes.ts
│   │   └── auth.service.ts
│   └── users/
│       ├── domain/            # Models, Interfaces
│       ├── application/       # Business Logic (Services)
│       └── infrastructure/    # Controllers, Routes
├── middleware/
└── app.ts
```

---

## 🤝 Contributing

We welcome contributions! To get started:

1. Clone the repository.
2. Install dependencies: `npm install`
3. Run the CLI in development mode: `npm run dev`
4. Build the project: `npm run build`

Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
