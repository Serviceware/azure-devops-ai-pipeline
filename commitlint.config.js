module.exports = {
  extends: ["./node_modules/commitlint-config-gitmoji"],
  rules: {
    "header-max-length": [0, "always", Infinity],
    "subject-empty": [0, "always"],
    "body-leading-blank": [0, "never"],
    "scope-case": [0, "never"],
  },
};
