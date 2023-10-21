module.exports = {
  "array-callback-return": "warn",
  "getter-return": "warn",
  "new-parens": "warn",
  "no-array-constructor": "warn",
  "no-caller": "error",
  "no-cond-assign": "warn",
  "no-const-assign": "error",
  "no-control-regex": "warn",
  "no-dupe-args": "warn",
  "no-dupe-class-members": "warn",
  "no-dupe-keys": "warn",
  "no-duplicate-case": "warn",
  "no-empty-character-class": "warn",
  "no-empty-pattern": "warn",
  "no-empty": ["warn", { allowEmptyCatch: true }],
  "no-eval": "error",
  "no-ex-assign": "warn",
  "no-extend-native": "warn",
  "no-extra-bind": "warn",
  "no-extra-label": "warn",
  "no-extra-boolean-cast": "warn",
  "no-func-assign": "error",
  "no-global-assign": "error",
  "no-implied-eval": "warn",
  "no-invalid-regexp": "warn",
  "no-label-var": "warn",
  "no-labels": ["warn", { allowLoop: true }],
  "no-lone-blocks": "warn",
  "no-loop-func": "warn",
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
  "no-unsafe-negation": "warn",
  "no-new-func": "warn",
  "no-new-object": "warn",
  "no-octal": "warn",
  "no-redeclare": "error",
  "no-script-url": "warn",
  "no-self-assign": "warn",
  "no-self-compare": "warn",
  "no-sequences": "warn",
  "no-shadow-restricted-names": "warn",
  "no-sparse-arrays": "warn",
  "no-template-curly-in-string": "warn",
  "no-this-before-super": "warn",
  "no-undef": "error",
  "no-unreachable": "warn",
  "no-unused-expressions": [
    "warn",
    {
      allowShortCircuit: true,
      allowTernary: true,
      allowTaggedTemplates: true,
    },
  ],
  "no-unused-labels": "warn",
  "no-unused-vars": [
    "warn",
    {
      args: "none",
      ignoreRestSiblings: true,
    },
  ],
  "no-use-before-define": [
    "warn",
    { classes: false, functions: false, variables: false },
  ],
  "no-useless-computed-key": "warn",
  "no-useless-concat": "warn",
  "no-useless-constructor": "warn",
  "no-useless-escape": "warn",
  "no-useless-rename": "warn",
  "require-yield": "warn",
  "use-isnan": "warn",
  "valid-typeof": "warn",
};
