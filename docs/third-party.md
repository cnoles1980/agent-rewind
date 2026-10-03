# Third-party notices and assets

- Agent Rewind source: MIT (root LICENSE).
- Inter and IBM Plex Mono: SIL Open Font License, bundled locally through their `@fontsource` packages. Original license text is copied into `web/public/licenses/THIRD_PARTY.txt` and distributed with the built app at `/licenses/THIRD_PARTY.txt`.
- Phosphor icons: MIT, from `@phosphor-icons/react`.
- React, Vite, TypeScript, FastAPI, Pydantic, and other dependencies retain their package licenses. Lockfiles record the resolved dependencies.
- Nebius Contree client 0.2.2: Apache-2.0 according to the installed distribution metadata; pinned in `uv.lock`.
- The supplied ChatGPT mockup is a visual reference. Its image is not shipped as the interface or copied into the repository. The AR PNG is an AI-derived asset made from the supplied mark; its generation prompt and provenance are in [logo-asset.md](logo-asset.md). Review the final brand asset before submission.
- `examples/*.json` are original synthetic fixtures, explicitly marked `fixture`. They contain no personal chats or genuine provider outputs. Generated screenshots of those fixtures may be used in documentation, but must not be described as proof of live execution.

Review transitive dependency and asset licenses before publishing. Dependency vulnerability scans are point-in-time checks, not a guarantee of safety.
