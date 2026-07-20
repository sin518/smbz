import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      // 现有客户端页面大量在 effect 中从 localStorage 等外部状态初始化。
      // 先保留告警，避免迁移 ESLint 时一次性阻断 CI；后续按模块逐步重构。
      "react-hooks/set-state-in-effect": "warn"
    }
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "packages/core/dist/**",
    "next-env.d.ts"
  ])
]);
