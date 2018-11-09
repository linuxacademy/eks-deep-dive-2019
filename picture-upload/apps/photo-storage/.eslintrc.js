module.exports = {
  "extends": "airbnb-base",
  "plugins": [
      "import",
  ],
  "rules": {
    "comma-dangle": ["warn", {
      arrays: "always-multiline",
      objects: "always-multiline",
      imports: "always-multiline",
      exports: "always-multiline",
      functions: "never",
    }],
    "consistent-return": "off",
    "no-confusing-arrow": ["warn", { allowParens: true }],
    "max-len": ["warn", { code: 90, ignoreComments: true, ignorePattern: '^test\\(' }],
    "no-console": "off",
  },
};
