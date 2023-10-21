module.exports = {
  "react/display-name": "warn",
  "react/forbid-foreign-prop-types": ["warn", { allowInPropTypes: true }],
  "react/jsx-key": "warn",
  "react/jsx-no-comment-textnodes": "warn",
  "react/jsx-no-target-blank": "warn",
  "react/jsx-no-undef": "error",
  "react/jsx-pascal-case": ["warn", { allowAllCaps: true }],
  "react/jsx-uses-react": "warn",
  "react/jsx-uses-vars": "warn",
  "react/no-danger-with-children": "warn",
  "react/no-direct-mutation-state": "warn",
  "react/no-find-dom-node": "warn",
  "react/no-is-mounted": "warn",
  "react/no-render-return-value": "error",
  "react/no-string-refs": "warn",
  "react/no-typos": "warn",
  "react/react-in-jsx-scope": "off",
  "react/require-render-return": "error",
  "react/style-prop-object": "warn",

  // react-hooks
  // https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
  "react-hooks/exhaustive-deps": "warn",
  "react-hooks/rules-of-hooks": "error",
};
