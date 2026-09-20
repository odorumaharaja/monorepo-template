---
name: ts-code-gen
description: >-
  Skill for creating and editing TypeScript / React code. Triggered when the user requests to create, write, or implement TypeScript code or React components.
---

# TypeScript Code Creation Skill

This skill outlines the standard procedures and best practices for creating and modifying TypeScript (React) code within this monorepo workspace.

## General Principles
- Use **TypeScript** strictly. Minimize the use of `any` and leverage interfaces and type aliases.
- Follow the project's formatting and linting rules (e.g., as defined in `.oxlintrc.json`).
- Ensure all new files are placed in the appropriate `frontend-*` service directory.
- Maintain clear service boundaries: No direct imports between `frontend-*` and `backend-*`.

## React & Frontend Guidelines
- **Functional Components**: Write all components as functional components using React Hooks.
- **Props Definition**: Strongly type all component props using interfaces.
- **Performance**: Use `useMemo` and `useCallback` where necessary to avoid unnecessary re-renders.
- **Keys**: Always use unique identifiers for `key` props in arrays; avoid using array indices.
- **Dependencies**: Maintain consistency with the shared React / Vite / TypeScript versions across the monorepo.

## Implementation Steps
1. **Understand Requirements**: Clarify the feature or component to be built.
2. **Scaffold Files**: Create the necessary `.ts` or `.tsx` files in the correct frontend directory.
3. **Write Code**: Implement the logic adhering to the above guidelines.
4. **Review**: Ensure no hard-coded secrets or magic numbers are included.
5. **Write Tests**: If applicable, add tests for the new component or utility.
