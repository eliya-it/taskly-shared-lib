# **Taskly Shared Library**

## **Overview**

The **Taskly Shared Library** contains common utilities and middleware used across the Taskly microservices. It ensures consistency, code reusability, and maintainability by centralizing essential functionalities like authentication, request validation, and database operations.

## **Features**

- **Authentication & Authorization**
  - JWT token generation & verification
  - Role-Based Access Control (RBAC)
  - Middleware for securing routes
- **Request Validation**
  - Centralized validation schemas
  - Error handling utilities
- **Database Helpers**
  - Generic CRUD utilities
  - Reusable database connection logic
- **Event Handling**
  - Common utilities for NATS Streaming & AWS SNS/SQS

## **Installation**

```sh
npm install @taskly/shared
```
