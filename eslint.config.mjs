// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'packages/*/dist/**',
            'packages/*/node_modules/**',
            'packages/contracts/artifacts/**',
            'packages/contracts/cache/**',
            'packages/contracts/typechain-types/**',
            'packages/backend/check-*.js', // 체크 스크립트들 제외
            'packages/backend/test-*.js',  // 테스트 스크립트들 제외
            'eslint.config.mjs'
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintPluginPrettierRecommended,
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
            sourceType: 'module',
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/no-unsafe-argument': 'warn',
            '@typescript-eslint/no-unsafe-assignment': 'warn',
            '@typescript-eslint/no-unsafe-member-access': 'warn',
            '@typescript-eslint/no-unsafe-call': 'warn',
            '@typescript-eslint/no-unsafe-return': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            '@typescript-eslint/require-await': 'warn',
            '@typescript-eslint/no-base-to-string': 'warn',
            '@typescript-eslint/restrict-template-expressions': 'warn',
            '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
            'prettier/prettier': 'error'
        },
    },
    // Backend 전용 설정
    {
        files: ['packages/backend/src/**/*.ts'],
        languageOptions: {
            parserOptions: {
                project: './packages/backend/tsconfig.json',
            },
        },
        rules: {
            // Backend 특화 규칙들
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-unsafe-argument': 'warn',
            '@typescript-eslint/no-unsafe-assignment': 'warn',
            '@typescript-eslint/no-unsafe-member-access': 'warn',
        },
    },
    // Contracts 전용 설정 (JavaScript/TypeScript)
    {
        files: [
            'packages/contracts/scripts/**/*.ts',
            'packages/contracts/test/**/*.ts',
            'packages/contracts/hardhat.config.ts'
        ],
        languageOptions: {
            parserOptions: {
                project: './packages/contracts/tsconfig.json',
            },
        },
        rules: {
            // Contracts 특화 규칙들
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-var-requires': 'off',
            'no-console': 'off', // Hardhat 스크립트에서 console 사용 허용
        },
    }
);
