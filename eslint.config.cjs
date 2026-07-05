// Flat config for ESLint v9+ with TypeScript and Prettier
module.exports = [
	{
		ignores: ['node_modules/**', 'dist/**', 'csharp-backend/**', 'saved_games.json'],
	},
	{
		files: ['**/*.ts', 'src/**/*.ts'],
		languageOptions: {
			parser: require('@typescript-eslint/parser'),
			parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
		},
		plugins: {
			'@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
			'prettier': require('eslint-plugin-prettier')
		},
		rules: {
			'prettier/prettier': 'error'
		}
	}
];
