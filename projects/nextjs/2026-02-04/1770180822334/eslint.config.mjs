import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Accessibility rules (jsx-a11y plugin is already included by eslint-config-next)
      // Enforce alt text on images
      "jsx-a11y/alt-text": "error",
      // Ensure interactive elements are keyboard accessible
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      // Require aria-labels on icon buttons
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      // Ensure form labels
      "jsx-a11y/label-has-associated-control": "warn",
      // Ensure heading hierarchy
      "jsx-a11y/heading-has-content": "error",
      // Ensure role attributes are valid
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
