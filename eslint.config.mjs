import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
  {
    files: ["packages/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: ["@anklo/db", "@anklo/ui", "next", "next/*", "@prisma/*"] },
      ],
    },
  },
  {
    files: ["packages/contracts/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@anklo/db",
            "@anklo/domain",
            "@anklo/ui",
            "@anklo/web",
            "next",
            "next/*",
            "@prisma/*",
          ],
        },
      ],
    },
  },
  {
    files: ["packages/db/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: ["@anklo/web", "@anklo/ui", "next", "next/*"] },
      ],
    },
  },
  {
    files: ["packages/ui/**/*.ts", "packages/ui/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: ["@anklo/db", "@prisma/*", "next", "next/*"] },
      ],
    },
  },
  globalIgnores(["**/.next/**", "**/coverage/**", "**/*.tsbuildinfo"]),
]);
