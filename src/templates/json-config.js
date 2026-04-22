/**
 * JSON Config File Template
 * Looks like a package.json or tsconfig.json file.
 */

module.exports = {
  header: `{
  "name": "my-project",
  "version": "1.2.0",
  "description": "A modern web application built with React and TypeScript",
  "private": true,
  "author": "dev-team@example.com",
  "license": "MIT",
`,
  sections: [
    `  "scripts": {
    "dev": "vite --host",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\""
  },
`,
    `  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.8.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "date-fns": "^2.30.0",
    "lodash-es": "^4.17.21",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
`,
    `  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@types/lodash-es": "^4.17.12",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.53.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.4",
    "postcss": "^8.4.31",
    "prettier": "^3.1.0",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.0",
    "vitest": "^0.34.6"
  },
`,
    `  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
`
  ],
  footer: `}
`,
  slots: 4
};
