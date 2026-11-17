# GitHub presentation audit — 2026-11-17

## Current GitHub About

| field | current value |
|---|---|
| name | `kiritsu` |
| description | KIRITSU — 規律 / VIMLORE. A real-Vim cyberpunk bureaucratic noir: 51 stages, diff-tested engine, hand-traced CRT title, touch Vim side rail, free offline PWA. In development. |
| homepage | <https://jungdonghee.github.io/kiritsu/> |
| topics | `kiritsu`, `vimlore`, `vim`, `neovim`, `vim-adventures`, `browser-game`, `pwa`, `offline`, `cyberpunk`, `crt`, `vector-graphics`, `ouyang-xun`, `terminal`, `typescript`, `game`, `kanji`, `mobile`, `touch-keyboard`, `vim-keyboard` |
| license | MIT |
| Pages | enabled, GitHub Actions deployment |

## Assets

| asset | current state |
|---|---|
| `public/icons/icon-512.png` | red hanko seal with 規律, chamfered hacker frame |
| `public/icons/favicon*.png/svg` | K seal, legible at 16 px |
| `docs/hero.jpg` | current final title screen (v15 glyph + tagline), 1200×680 |
| `docs/browser/desktop-title.jpg` | current 1920×1080 desktop title |
| `docs/browser/desktop-play.jpg` | current first chamber (`kiritsu://` path) |
| `docs/social-preview.png` | current final title crop, 1280×640; also served as OG/Twitter card |
| `public/social-preview.png` | same card, served for OG/Twitter |
| `docs/browser/pwa/*` | current PWA landscape title, FOCUS compass, touch play, portrait gate, offline |
| `docs/browser/pwa/landscape-focus.png` | FOCUS MOVE compass + COMMON footer |
| `docs/browser/pwa/landscape-play.png` | touch gameplay with the full-height side rail |
| `docs/browser/desktop-play.jpg` | current gameplay capture; README first-chamber cell |

Social preview and avatar are **GitHub web-UI only** (the API does not expose
the social-preview setting); upload `docs/social-preview.png` and
`public/icons/icon-512.png` manually if GitHub still shows an old cached card.
The repo description/homepage/topics were updated through the API on
2026-11-17; the Pages OG image is `public/social-preview.png`.

## Current live

<https://jungdonghee.github.io/kiritsu/>

## Update checklist

1. Capture desktop 1920×1080 title + play, touch 844×390 title/FOCUS/play and
   portrait gate (current Playwright workflow).
2. Regenerate hero 1200×680 and social 1280×640 from the title capture; copy the
   social card to `public/`.
3. `npm run presentation:check && npm run doc-check && npm run budget`.
4. Push; verify CI + Pages and the live title.
5. If the GitHub repo card still shows the old image, upload
   `docs/social-preview.png` in GitHub → Settings → Social preview (web UI only).
