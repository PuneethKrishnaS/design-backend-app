import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const codeQualityPlugin: Plugin = {
  name: 'code-quality',
  devDependencies: {
    'eslint': '^8.57.0',
    '@typescript-eslint/eslint-plugin': '^7.2.0',
    '@typescript-eslint/parser': '^7.2.0',
    'prettier': '^3.2.5',
    'eslint-config-prettier': '^9.1.0',
    'eslint-plugin-prettier': '^5.1.3',
    'husky': '^9.0.11',
    'lint-staged': '^15.2.2'
  },
  execute: async (context: PluginContext) => {
    const { targetDir } = context;

    // 1. ESLint config
    await fs.writeFile(path.join(targetDir, '.eslintrc.json'), JSON.stringify({
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier'
      ],
      plugins: ['@typescript-eslint', 'prettier'],
      rules: {
        'prettier/prettier': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off'
      }
    }, null, 2));

    // 2. Prettier config
    await fs.writeFile(path.join(targetDir, '.prettierrc'), JSON.stringify({
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      printWidth: 100,
      tabWidth: 2
    }, null, 2));

    // 3. Update package.json scripts for lint and format, and husky prepare
    const packageJsonPath = path.join(targetDir, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJson(packageJsonPath);
      pkg.scripts = pkg.scripts || {};
      pkg.scripts.lint = 'eslint "src/**/*.ts"';
      pkg.scripts['lint:fix'] = 'eslint "src/**/*.ts" --fix';
      pkg.scripts.format = 'prettier --write "src/**/*.ts"';
      pkg.scripts.prepare = 'husky';

      pkg['lint-staged'] = {
        'src/**/*.ts': [
          'eslint --fix',
          'prettier --write'
        ]
      };

      await fs.writeJson(packageJsonPath, pkg, { spaces: 2 });
    }

    // 4. Husky setup - we won't run `husky init` right away because they haven't run npm install yet
    // But we can pre-create the `.husky` directory and pre-commit hook file.
    const huskyDir = path.join(targetDir, '.husky');
    await fs.ensureDir(huskyDir);
    await fs.writeFile(path.join(huskyDir, 'pre-commit'), `npx lint-staged\n`);
  }
};
