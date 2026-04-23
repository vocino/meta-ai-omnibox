# Privacy Policy

Last updated: 2026-04-23

## Meta (Unofficial) extension

Meta (Unofficial) is an independent open-source browser extension. It is not
affiliated with, endorsed by, or sponsored by Meta Platforms, Inc.

## Data collection and use

This extension does not collect, sell, or share personal data with the
maintainer or third parties.

The extension only stores one local preference in browser extension storage:

- `submitMode` (`manual` or `auto`)

This value is used only to remember whether prompt submission should happen
automatically after the prompt is filled on `meta.ai`.

## Website access

The extension runs only on:

- `https://www.meta.ai/*`
- `https://meta.ai/*`

It uses this access to:

- Read the `prompt` query parameter from the URL
- Fill the Meta AI composer with that prompt
- Optionally submit automatically when enabled by the user
- Remove the `prompt` parameter from the URL after processing

## Remote code and tracking

- The extension does not execute remote code.
- The extension does not include analytics, advertising, or tracking SDKs.

## Open source

Source code and issue tracker:

- <https://github.com/vocino/meta-ai-omnibox>

## Contact

For privacy questions, open an issue in the repository above.
