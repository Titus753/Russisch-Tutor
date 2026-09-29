// ESLint-Konfiguration: Typprüfung plus Sicherheitsregeln gegen HTML-/Code-Injektion.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/', 'dev-dist/', 'coverage/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // Kein dynamisch ausgeführter Code
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      // Leere catch-Blöcke verschlucken Fehler
      'no-empty': ['error', { allowEmptyCatch: false }],
      // Kein HTML aus Daten: alle Inhalte werden als Text gerendert
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'dangerouslySetInnerHTML ist verboten – Inhalte nur als Text rendern.',
        },
        {
          selector:
            'AssignmentExpression > MemberExpression.left[property.name=/^(innerHTML|outerHTML)$/]',
          message: 'innerHTML/outerHTML ist verboten – textContent verwenden.',
        },
        {
          selector:
            'CallExpression[callee.property.name=/^(insertAdjacentHTML|write|writeln|createContextualFragment)$/]',
          message: 'HTML-Einfügen per String ist verboten.',
        },
      ],
    },
  },
  prettier,
);
