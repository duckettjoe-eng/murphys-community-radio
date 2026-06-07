import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "warn",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "next-env.d.ts",
    "public/**",
    "app/lib/generatedMixcloudArchive.ts",
    "app/lib/generatedMusicArchive.ts",
  ]),
]);
