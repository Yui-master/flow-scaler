---
title: FR-01 Authentication & Profile Management Design
date: 2026-05-07
status: approved
---

# FR-01 Authentication & Profile Management Design

## Goal

Implement complete authentication entry points for FlowScaler with two supported login methods: username/password and Google OAuth. Sessions use Auth.js/NextAuth as the single source of truth so protected pages and APIs can rely on the same `auth()` flow.

## Scope

Included:

- Login page with username/password form and Google login action.
- Register page with name, username, email, and password form.
- Password hashing with bcrypt before persistence.
- Credentials login through Auth.js Credentials provider.
- Google OAuth login through the existing Google provider.
- User profile fields required by FR-01: name, email, avatar, timezone, and default configuration.
- Authenticated dashboard destination after login.
- Tests or verification covering registration, credentials login, and validation behavior.

Not included:

- Email verification.
- Password reset.
- Account linking UI for adding Google to an existing credentials account.
- Full profile settings page beyond persisted fields.

## Architecture

Auth.js/NextAuth remains the only session system. The existing Google provider stays in `src/server/auth/config.ts`, and a Credentials provider is added beside it. The Credentials provider accepts username and password, finds the matching Prisma user, compares the submitted password with the stored bcrypt hash, and returns the user to NextAuth only when the credentials are valid.

The Prisma `User` model is extended with:

- `username String? @unique`
- `passwordHash String?`
- `timezone String?`
- `defaultConfig Json?`

Google users may have no username or password hash. Credentials users must have both `username` and `passwordHash`. Existing NextAuth account/session tables continue to support OAuth sessions and database-backed session persistence.

## Routes and UI

Create these application pages:

- `/login`: username/password login form, Google login button, register link, and clear error states.
- `/register`: registration form for name, username, email, and password, plus a Google login CTA for users who prefer OAuth.
- `/dashboard`: authenticated destination after login. It can be a minimal dashboard shell for FR-01, but it must require a valid session and redirect anonymous users to `/login`.

The UI follows `docs/DESIGN.md`:

- Canvas background `#0a0a0a`.
- Dark form cards using `#1a1a1a` with subtle borders.
- Primary CTA background `#faff69` with black text.
- White display text and muted gray helper/error text.
- Compact, engineering-grade spacing with 8px button/input radius and 12px card radius.

## Data Flow

### Registration

1. Validate name, username, email, and password at the server boundary.
2. Reject duplicate username or email with a user-facing error.
3. Hash the password with bcrypt.
4. Create the Prisma user with `name`, `username`, `email`, `passwordHash`, `timezone`, and `defaultConfig`.
5. Redirect to `/login` or sign the user in with credentials after successful creation.

The implementation should choose one post-registration behavior and keep it consistent in UI copy. Automatic sign-in is preferred if it can reuse the same Credentials provider safely; otherwise redirect to `/login` with a success message.

### Username/password login

1. Submit username and password from `/login`.
2. Auth.js Credentials provider validates the payload.
3. Prisma looks up the user by username.
4. bcrypt compares the submitted password against `passwordHash`.
5. On success, NextAuth creates the session and redirects to `/dashboard`.
6. On failure, the page shows a generic invalid-credentials error.

### Google login

1. User clicks “Continue with Google”.
2. Auth.js starts OAuth with the existing Google provider.
3. Prisma adapter creates or updates the user/account records.
4. On success, NextAuth redirects to `/dashboard`.

## Error Handling

- Login failures should use a generic invalid-credentials message so the UI does not reveal whether a username exists.
- Registration can report duplicate username and duplicate email because those are account creation boundary errors.
- OAuth configuration errors should fail through the standard Auth.js flow; the UI only needs a friendly login error state.
- Passwords must never be logged or returned to the client.

## Testing and Verification

Verification must cover:

- Registration validation rejects invalid email, weak password, and duplicate username/email.
- Registration stores bcrypt hashes instead of plaintext passwords.
- Credentials login succeeds for a valid username/password pair.
- Credentials login fails for unknown username or wrong password.
- Google login button routes into the Auth.js Google sign-in flow.
- `/dashboard` redirects anonymous users to `/login` and renders for authenticated users.

Final verification commands:

- `npm run typecheck`
- `npm run lint`
- the project test command if a test runner is added or already present
- browser check of `/login`, `/register`, and authenticated dashboard routing

## Open Decisions

The design fixes the authentication architecture and UI scope. During implementation, the only allowed choice is whether successful registration signs the user in immediately or redirects them to login with a success message. Prefer immediate sign-in unless it complicates the Auth.js flow or test setup.
