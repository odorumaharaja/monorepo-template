---
name: python-code-gen
description: >-
  Skill for creating and editing Python / FastAPI code. Triggered when the user requests to create, write, or implement Python code, APIs, or backend services.
---

# Python Code Creation Skill

This skill outlines the standard procedures and best practices for creating and modifying Python (FastAPI) code within this monorepo workspace.

## General Principles
- Use **Python type hints** comprehensively for all function parameters and return types.
- Follow PEP 8 guidelines and standard Python naming conventions (snake_case for variables and functions, PascalCase for classes).
- Ensure all new files are placed in the appropriate `backend-*` service directory.
- Maintain clear service boundaries: No direct imports between `frontend-*` and `backend-*`.

## FastAPI & Backend Guidelines
- **Pydantic Models**: Use Pydantic models for strict request and response validation.
- **Dependency Injection**: Utilize FastAPI's `Depends` for reusable logic, database sessions, and authentication/authorization.
- **Error Handling**: Use `HTTPException` for meaningful HTTP error responses.
- **Async I/O**: Ensure non-blocking async code is used correctly, especially for database calls and external requests. Avoid blocking synchronous I/O inside async functions.
- **Dependencies**: Maintain consistency with the shared FastAPI / Uvicorn versions across the monorepo.

## Implementation Steps
1. **Understand Requirements**: Clarify the API endpoint, service, or logic to be built.
2. **Scaffold Files**: Create the necessary `.py` files in the correct backend directory.
3. **Write Code**: Implement the logic adhering to the above guidelines.
4. **Review**: Ensure no hard-coded secrets are included and inputs are properly validated.
5. **Write Tests**: Create corresponding tests using `pytest` and `httpx.AsyncClient`.
