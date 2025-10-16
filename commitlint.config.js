module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting, missing semi colons, etc; no code change
        'refactor', // Refactoring production code
        'test',     // Adding tests, refactoring test; no production code change
        'chore',    // Updating build tasks, package manager configs, etc; no production code change
        'perf',     // Performance improvements
        'ci',       // Continuous integration
        'build',    // Build system or external dependencies
        'revert'    // Reverts a previous commit
      ]
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never']
  }
};
