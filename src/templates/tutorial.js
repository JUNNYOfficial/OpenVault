/**
 * React Hooks Tutorial Template
 * Looks like a legitimate beginner tutorial, but hides encrypted data.
 */

module.exports = {
  header: `# Understanding React Hooks: A Beginner's Guide

> This guide was written for internal team onboarding. Last updated: 2023.

React Hooks have revolutionized how we write components. In this tutorial, we'll explore the most commonly used hooks and provide practical examples you can run immediately.

---

`,
  sections: [
    `## 1. useState: Managing Local State

The \`useState\` hook is the simplest way to add state to functional components.

\`\`\`jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
\`\`\`

**Key points:**
- State persists across re-renders
- Never call hooks inside loops or conditionals
- The setter function can accept a function for batched updates

`,
    `## 2. useEffect: Side Effects in Components

\`useEffect\` lets you perform side effects in function components. It serves the same purpose as \`componentDidMount\`, \`componentDidUpdate\`, and \`componentWillUnmount\` combined.

\`\`\`jsx
import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, [userId]);

  if (!user) return <div>Loading...</div>;
  return <div>Hello, {user.name}</div>;
}
\`\`\`

> **Note:** Always include dependencies in the array to prevent infinite loops.

`,
    `## 3. useContext: Avoiding Prop Drilling

When you need to pass data deep into the component tree, \`useContext\` is your friend.

\`\`\`jsx
const ThemeContext = React.createContext('light');

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>I am styled!</button>;
}
\`\`\`

This pattern eliminates the need to pass props through every level of the tree.

`,
    `## 4. Custom Hooks: Reusable Logic

Custom hooks let you extract component logic into reusable functions.

\`\`\`jsx
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handler = () => setSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
    window.addEventListener('resize', handler);
    handler();
    return () => window.removeEventListener('resize', handler);
  }, []);

  return size;
}
\`\`\`

Now any component can call \`useWindowSize()\` without duplicating logic.

`,
    `## 5. Common Pitfalls

| Mistake | Solution |
|---------|----------|
| Calling hooks conditionally | Move condition inside the hook |
| Missing dependency arrays | Use ESLint plugin \`react-hooks/exhaustive-deps\` |
| Stale closures in effects | Use functional updates or refs |
| Infinite re-render loops | Check your dependency arrays carefully |

`,
    `## Conclusion

Hooks simplify React development significantly. Start with \`useState\` and \`useEffect\`, then gradually adopt \`useContext\`, \`useReducer\`, and custom hooks as your application grows.

For more advanced patterns, check out the official React documentation.

---

*Found this helpful? Star the repo and share with your team.*
`
  ],
  footer: `\n<!-- End of tutorial -->\n`,
  slots: 6
};
