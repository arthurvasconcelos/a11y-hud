# Security Policy

## Supported Versions

Only the latest released minor version receives security fixes, as a new
patch release. This applies to `a11y-hud` and all framework packages
(`@a11y-hud/react`, `@a11y-hud/vue`, `@a11y-hud/svelte`, `@a11y-hud/solid`,
`@a11y-hud/angular`), which are released together.

| Version | Supported      |
|---------|----------------|
| 1.0.x   | ✓ current      |
| < 1.0   | ✗              |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a vulnerability, report it privately through **GitHub private
vulnerability reporting**: use the
[Report a vulnerability](../../security/advisories/new) button on the Security
tab of this repository. This keeps the report private until a fix is released.

Include as much of the following as possible:

- Type of issue (e.g. cross-site scripting, prototype pollution, unsafe DOM injection)
- The affected package(s) and source file(s)
- The version or git commit where the issue was introduced
- Your framework, bundler and browser versions
- Any special configuration required to reproduce
- Step-by-step instructions to reproduce
- Proof-of-concept or exploit code (if available)
- Impact and how an attacker might exploit it

## Scope

`a11y-hud` is a developer tool intended for use in development and staging
environments only. It should not be included in production builds. Issues that
only affect production use are outside the intended scope and not supported.

## Response

This project is maintained on a best-effort basis. There are no guaranteed
response times. Reports will be reviewed and addressed as time permits.

We aim to coordinate disclosure with the reporter before making any fix public.
Reporters who wish to be credited will be acknowledged in the release notes.
