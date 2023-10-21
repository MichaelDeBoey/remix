/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:node/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2022,
  },
  plugins: [],
  settings: {
    "import/ignore": ["\\.(css|md|svg|json)$"],
    "import/resolver": {
      node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
      typescript: { alwaysTryTypes: true },
    },
    react: {
      formComponents: ["Form"],
      linkComponents: [
        { name: "Link", linkAttribute: "to" },
        { name: "NavLink", linkAttribute: "to" },
      ],
      version: "detect",
    },
  },
  rules: {
    "array-callback-return": "error",
    "new-parens": "error",
    "no-array-constructor": "error",
    "no-caller": "error",
    // "no-empty": ["warn", { allowEmptyCatch: true }],
    "no-eval": "error",
    "no-extend-native": "error",
    "no-extra-bind": "error",
    "no-extra-label": "error",
    "no-implied-eval": "error",
    "no-labels": ["warn", { allowLoop: true }],
    "no-lone-blocks": "error",
    "no-loop-func": "error",
    "no-mixed-operators": [
      "warn",
      {
        groups: [
          ["&", "|", "^", "~", "<<", ">>", ">>>"],
          ["==", "!=", "===", "!==", ">", ">=", "<", "<="],
          ["&&", "||"],
          ["in", "instanceof"],
        ],
        allowSamePrecedence: false,
      },
    ],
    "no-new-func": "error",
    "no-new-object": "error",
    "no-script-url": "error",
    "no-self-compare": "error",
    "no-sequences": "error",
    "no-template-curly-in-string": "error",
    "no-unused-expressions": [
      "warn",
      {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      },
    ],
    // "no-unused-vars": [
    //   "warn",
    //   {
    //     args: "none",
    //     ignoreRestSiblings: true,
    //   },
    // ],
    "no-useless-computed-key": "error",
    "no-useless-concat": "error",
    "no-useless-constructor": "error",
    "no-useless-rename": "error",

    "import/first": "error",
    "import/no-amd": "error",
    "import/no-duplicates": "error", //
    "import/no-webpack-loader-syntax": "error",

    "jsx-a11y/anchor-has-content": [
      "error",
      { components: ["Link", "NavLink"] },
    ],
    // "jsx-a11y/anchor-is-valid": ["warn", { aspects: ["noHref", "invalidHref"] }],
    "jsx-a11y/aria-role": ["warn", { ignoreNonDOM: true }],
    "jsx-a11y/lang": "error",

    "react/forbid-foreign-prop-types": ["warn", { allowInPropTypes: true }],
    "react/jsx-pascal-case": "error",
    "react/no-typos": "error",
    "react/style-prop-object": "error",
  },
  overrides: [
    {
      files: ["**/routes/**/*.tsx", "app/root.tsx"],
      extends: [],
      plugins: [],
      rules: {
        // Routes may use default exports without a name. At the route level
        // identifying components for debugging purposes is less of an issue, as
        // the route boundary is more easily identifiable.
        "react/display-name": "off",
      },
    },
    {
      files: ["**/__tests__/**/*", "**/*.{spec,test}.*"],
      extends: [
        "plugin:jest/recommended",
        "plugin:jest-dom/recommended",
        "plugin:testing-library/react",
      ],
      plugins: [],
      rules: {},
    },
  ],
};
