---
name: code-review
description: >-
  Skill for performing code reviews. Triggered when the user requests "code review", "please review", etc.
  Supports both TypeScript (React) and Python (FastAPI).
  Checks security, performance, maintainability, and repository‑specific architectural guidelines, providing a structured Markdown report.
---

# Code Review Skill

This skill defines the procedure for systematic code reviews within the workspace.

---

## Identify Review Target

1. If the user specifies **specific files or directories**, those become the review target.
2. If the user mentions **"recent changes"**, obtain the diff via `git diff` or `git diff --cached`.
3. If the target is **unspecified**, default to the currently opened file(s) or the most recently edited files. Prompt the user if the target remains ambiguous.

---

## Review Dimensions

The code will be examined under the following categories, each tagged with a severity label (🔴 Critical / 🟡 Warning / 🔵 Info).

### 1. Correctness

- Logical errors, off‑by‑one mistakes, missing boundary checks
- Type mismatches (overuse of `any` in TypeScript, missing type hints in Python)
- Unsafe access to `null/undefined/None`
- Missing `await` or unhandled Promises

### 2. Security

- SQL injection, XSS, CSRF vulnerabilities
- Hard‑coded secrets (API keys, passwords)
- Insufficient input validation / sanitization
- Missing authentication/authorization on FastAPI endpoints
- Overly permissive CORS settings

### 3. Performance

- N+1 queries, heavy processing inside loops
- Unnecessary React re‑renders (evaluate `useMemo` / `useCallback` usage)
- Bundle size impact from large imports
- Blocking synchronous I/O inside async functions in Python

### 4. Maintainability & Readability

- Violations of the Single‑Responsibility Principle (large functions/components)
- Inconsistent naming conventions (camelCase vs snake_case)
- Presence of magic numbers / strings
- Over/under commenting, missing docstrings
- Duplicate code that breaches DRY

### 5. Testing

- Presence of tests for the changed code
- Coverage of edge‑cases and error paths
- Test quality (excessive mocking, tight coupling to implementation)

### 6. Repository Architecture Guidelines

Check the project‑specific rules:

- **Service boundaries**: No direct imports between `frontend-*` and `backend-*` (communication must go through APIs).
- **Docker configuration**: Dockerfile changes must be reflected in `docker-compose.yml`.
- **Nginx routing**: New endpoints should be added to `nginx/nginx.conf`.
- **Dependency consistency**:
  - Frontend services share the same React / Vite / TypeScript versions.
  - Backend services share the same FastAPI / Uvicorn versions.
- **File placement**: New code resides in the appropriate service directory.
- **Build scripts**: New frontend services are added to `scripts/build-frontend.sh`.

---

## Language‑Specific Checks

### TypeScript / React

- `strict` mode enabled, minimize `any` usage
- Proper prop type definitions for components
- Correct usage of React hooks (dependency arrays, no conditional hook calls)
- Proper `key` prop usage (avoid array index keys)
- Compliance with the project's `.oxlintrc.json` settings

### Python / FastAPI

- Type hints present for functions and variables
- Request/response validation via Pydantic models
- Meaningful error handling with `HTTPException`
- Dependency injection using FastAPI `Depends`
- Tests using `pytest` + `httpx.AsyncClient`

---

## Review Execution Steps

1. **Load target code**: Use `view_file` to read the files.
2. **Obtain diffs**: For change reviews, run `git diff`.
3. **Run static analysis** when available:
   - Frontend: `cd <frontend-dir> && npm run lint`
   - Backend: `cd <backend-dir> && pytest --collect-only`
4. **Perform checklist review** across all dimensions above.
5. **Generate report** using the template below.

---

## Report Template

The review output is saved as `code_review_report.md` (a Markdown artifact).

```markdown
# Code Review Report

**Review Date**: YYYY-MM-DD HH:MM
**Target**: (list of files/directories or commit range)

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | N |
| 🟡 Warning  | N |
| 🔵 Info     | N |

## Overall Assessment

(Brief 2‑3 sentence evaluation and main concerns)

---

## Findings

### 🔴 Critical

#### 1. <Issue Title>
- **File**: [filename](file:///path/to/file#L10-L20)
- **Category**: Security / Correctness / ...
- **Description**: Detailed explanation of the problem.
- **Suggested Fix**:
  ```diff
  - problematic code
  + corrected code
  ```

### 🟡 Warning

(Repeat same structure)

### 🔵 Info

(Repeat same structure)

---

## Architectural Compliance Check

| Check Item | Result |
|------------|--------|
| Service boundary adherence | ✅ / ❌ |
| Docker configuration consistency | ✅ / ❌ |
| Nginx routing updates | ✅ / ❌ / N/A |
| Dependency version alignment | ✅ / ❌ |
| Build script updates | ✅ / ❌ / N/A |

---

## Recommended Actions

1. (Highest‑priority fix)
2. (Next priority fix)
3. ...
```

---

## Notes

- Issues must be **specific** and **actionable** – provide concrete code snippets rather than vague statements.
- All file references are **clickable links** (`[filename](file:///path#L10-L20)`).
- Include **positive feedback** for good code (🟢 Good).
- Sort findings by **Critical → Warning → Info** to focus attention.
```
