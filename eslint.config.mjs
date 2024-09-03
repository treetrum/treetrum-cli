import pluginJs from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * @type {import("eslint").Linter.FlatConfig[]}
 */
export default [
    { languageOptions: { globals: globals.node } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["src/**/*"],
        rules: {
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
];
