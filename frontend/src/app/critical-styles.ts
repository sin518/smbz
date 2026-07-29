export const criticalStyles = `
:root {
  --color-ink: #2f2d2a;
  --color-muted-ink: #68645d;
  --color-gold: #765b18;
  --color-paper: #f8f7ee;
  --color-surface: #ffffff;
  --color-row-border: #ebe7dd;
  --color-control: #f2f0e8;
  --color-nav-text: #5f5b62;
  --color-focus: #765b18;
  --glass-surface: rgba(255, 255, 255, 0.52);
  --glass-highlight: rgba(255, 255, 255, 0.78);
  --shadow-soft: 0 16px 40px rgba(16, 14, 10, 0.06);
  color: var(--color-ink);
  background: var(--color-paper);
}

:root[data-theme="dark"] {
  --color-ink: #f4f4f5;
  --color-muted-ink: #b8b8bd;
  --color-gold: #f4f4f5;
  --color-paper: #0d0d0f;
  --color-surface: #1f2024;
  --color-row-border: #3a3b40;
  --color-control: #15161a;
  --color-nav-text: #a7a7ad;
  --color-focus: #f0cf7a;
  --glass-surface: rgba(28, 29, 33, 0.58);
  --glass-highlight: rgba(255, 255, 255, 0.13);
  --shadow-soft: 0 18px 46px rgba(0, 0, 0, 0.38);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
  background: var(--color-paper);
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

:where(h1, h2, p) {
  margin: 0;
}

:where(a) {
  color: inherit;
  text-decoration: none;
}

:where(button) {
  color: inherit;
  font: inherit;
}

:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 3px;
}

.home-loading-shell {
  min-height: 100vh;
  width: 100%;
  max-width: 430px;
  margin-inline: auto;
  background: var(--color-paper);
}

.home-shell {
  position: relative;
  display: flex;
  width: 100%;
  max-width: min(100%, 430px);
  height: 100dvh;
  margin-inline: auto;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-paper);
  color: var(--color-ink);
  box-shadow: var(--shadow-soft);
}

.home-glass {
  background:
    linear-gradient(135deg, var(--glass-highlight), transparent 42%),
    var(--glass-surface);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.56),
    inset 0 -1px 0 rgba(255, 255, 255, 0.18),
    0 12px 34px rgba(42, 32, 13, 0.14);
  -webkit-backdrop-filter: blur(22px) saturate(165%);
  backdrop-filter: blur(22px) saturate(165%);
}

.home-header {
  position: absolute;
  inset: 0 0 auto;
  z-index: 20;
  display: flex;
  height: 80px;
  padding-inline: 20px;
  flex: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.55);
}

.home-title {
  flex: none;
  color: #000000;
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.04em;
  text-align: center;
}

.home-tagline {
  display: flex;
  width: 100%;
  min-width: 0;
  margin-top: 10px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-muted-ink);
}

.home-tagline-line {
  width: 24px;
  height: 1px;
  flex: none;
  background: #d9c9a3;
}

.home-tagline-text {
  min-width: 0;
  overflow: hidden;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-scroll {
  min-height: 0;
  padding: 92px 16px calc(92px + env(safe-area-inset-bottom));
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
}

.home-scroll::-webkit-scrollbar {
  display: none;
}

.home-card-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}

.home-card-link {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
}

.home-card {
  position: relative;
  min-height: 132px;
  padding: 18px 20px;
  overflow: hidden;
  border: 1px solid #e5d8bc;
  border-radius: 16px;
  background: #fffdf7;
  box-shadow: 0 8px 22px rgba(70, 53, 20, 0.055);
  transition: transform 200ms ease;
}

.home-card-link:active .home-card {
  transform: scale(0.99);
}

.home-card-corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-right: 1px solid #dfcfa9;
  border-bottom: 1px solid #dfcfa9;
  opacity: 0.8;
  pointer-events: none;
}

.home-card-corner::after {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 10px;
  height: 10px;
  border-right: 1px solid #dfcfa9;
  border-bottom: 1px solid #dfcfa9;
  border-radius: 0 0 8px;
  content: "";
}

.home-card-corner--top {
  top: 12px;
  left: 12px;
  transform: rotate(180deg);
}

.home-card-corner--bottom {
  right: 12px;
  bottom: 12px;
}

.home-card-content {
  position: relative;
  z-index: 10;
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}

.home-card-heading {
  position: relative;
  min-height: 48px;
  padding-right: 62px;
}

.home-card-title {
  color: #34322f;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: 0.02em;
}

.home-card-mark {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  width: 50px;
  height: 50px;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  border-radius: 999px;
  box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.12);
}

.home-card-mark--red {
  border-color: #d44623;
  background: #c92b12;
  color: #f8d28b;
}

.home-card-mark--purple {
  border-color: #8f7969;
  background: #40335d;
  color: #f6c979;
}

.home-card-mark--brown {
  border-color: #d19c51;
  background: #9a5f1f;
  color: #ffe1a1;
}

.home-card-mark--gold {
  border-color: #d9a450;
  background: #b07222;
  color: #ffe0a6;
}

.divination-module-mark--home {
  display: block;
  width: 20px;
  height: 40px;
  fill: currentColor;
  user-select: none;
}

.divination-module-mark--header {
  display: block;
  width: 12px;
  height: 24px;
  fill: currentColor;
  user-select: none;
}

.home-card-details {
  display: flex;
  padding-left: 4px;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.home-card-description {
  color: #74716a;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.375;
}

.home-card-suitable {
  padding: 4px 10px;
  flex: none;
  border: 1px solid #ead9b4;
  border-radius: 999px;
  background: #fbf4e4;
  color: var(--color-gold);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.25;
  text-align: right;
}

.app-bottom-nav {
  position: fixed;
  bottom: calc(10px + env(safe-area-inset-bottom));
  left: 50%;
  z-index: 30;
  display: grid;
  width: calc(100% - 24px);
  max-width: min(calc(100% - 24px), 406px);
  height: 62px;
  padding: 6px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 28px;
  transform: translateX(-50%);
}

.app-bottom-nav-indicator {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 6px;
  width: calc((100% - 12px) / 3);
  border-radius: 22px;
  background:
    radial-gradient(circle at 28% 18%, rgba(255, 255, 255, 0.9), transparent 42%),
    linear-gradient(135deg, rgba(255, 249, 230, 0.88), rgba(237, 207, 145, 0.48));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 5px 16px rgba(145, 102, 25, 0.13);
  pointer-events: none;
  transition:
    transform 360ms cubic-bezier(0.22, 1.28, 0.36, 1),
    border-radius 190ms ease-out;
  will-change: transform;
}

.app-bottom-nav-link {
  position: relative;
  z-index: 10;
  display: flex;
  min-height: 44px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 22px;
  color: var(--color-nav-text);
  transition: color 200ms ease;
}

.app-bottom-nav-link--active {
  color: #a67416;
}

.app-bottom-nav-label {
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

:root[data-theme="dark"] .home-title,
:root[data-theme="dark"] .home-card-title,
:root[data-theme="dark"] .home-card-description {
  color: var(--color-ink);
}

:root[data-theme="dark"] .home-card {
  border-color: var(--color-row-border);
  background: var(--color-surface);
}

:root[data-theme="dark"] .home-card-suitable {
  border-color: var(--color-row-border);
  background: var(--color-control);
}

:root[data-theme="dark"] .app-bottom-nav-indicator {
  background:
    radial-gradient(circle at 28% 18%, rgba(255, 255, 255, 0.18), transparent 42%),
    linear-gradient(135deg, rgba(112, 91, 48, 0.64), rgba(78, 64, 38, 0.5));
}

@media (min-width: 640px) {
  .home-title {
    font-size: 26px;
  }

  .home-tagline-text,
  .home-card-suitable {
    font-size: 12px;
  }

  .home-scroll {
    padding-right: 24px;
    padding-bottom: calc(104px + env(safe-area-inset-bottom));
    padding-left: 24px;
  }

  .home-card-list {
    gap: 16px;
  }

  .home-card {
    min-height: 150px;
    padding: 20px 24px;
  }

  .home-card-title {
    font-size: 30px;
  }

  .home-card-mark {
    width: 54px;
    height: 54px;
  }

  .home-card-description {
    font-size: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
}
`;
