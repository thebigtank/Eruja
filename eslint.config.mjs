import next from 'eslint-config-next';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'reference/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  ...next,
  prettier,
];

export default eslintConfig;
