# AGENTS.md - VibeSync Development Guidelines

## Project Structure

Full-stack JavaScript application with:
- **Backend**: Node.js + Express + MongoDB/Mongoose + Socket.io
- **Frontend**: React (Create React App) + React Router

## Build/Development Commands

### Backend
```bash
cd backend
npm start      # Production server (node server.js)
npm run dev    # Development with nodemon
```

### Frontend
```bash
cd frontend
npm start      # Development server (localhost:3000)
npm run build  # Production build
npm test       # Run all tests in watch mode
npm test -- --testPathPattern=ComponentName  # Run single test file
npm test -- --testNamePattern="test name"    # Run single test
npm test -- --watchAll=false                  # Run tests once
```

### Testing
- Uses Jest via react-scripts
- Test files: `*.test.js` or `*.spec.js`
- Run single test: `npm test -- --testPathPattern=LoginForm`
- Run tests once: `npm test -- --watchAll=false --coverage`

## Code Style Guidelines

### General
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Optional (follow existing file style)
- **Line endings**: LF
- **Max line length**: 100 characters

### Backend (Node.js)

#### Imports
- Use CommonJS: `const express = require('express')`
- Group imports: built-ins → npm packages → local modules
- Local modules use relative paths: `../models/User`

#### Naming Conventions
- Files: camelCase (e.g., `auth.js`, `friends.js`)
- Models: PascalCase (e.g., `User.js`, `Friend.js`)
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE for true constants

#### Error Handling
- Use try/catch in async route handlers
- Return appropriate HTTP status codes:
  - 200: Success
  - 201: Created
  - 400: Bad Request
  - 401: Unauthorized
  - 404: Not Found
  - 500: Server Error
- Error response format: `{ error: 'message' }`
- Log errors with `console.log('Context:', error.message)`

#### Routes
- Base path: `/api/{resource}`
- Use router middleware: `const router = express.Router()`
- Export: `module.exports = router`
- Route order: GET → POST → PUT → DELETE

#### Models (Mongoose)
- Use `new mongoose.Schema()` with explicit types
- Enable timestamps: `{ timestamps: true }`
- Reference other models with: `{ type: mongoose.Schema.Types.ObjectId, ref: 'ModelName' }`

### Frontend (React)

#### Imports
- React first: `import React from 'react'`
- Third-party libraries next
- Local components: `import Component from './components/Component'`
- CSS last: `import './Component.css'`

#### Naming Conventions
- Components: PascalCase (e.g., `HomePage.jsx`, `LoginForm.jsx`)
- Files: Match component name
- Hooks: camelCase starting with 'use'
- Props: camelCase

#### Components
- Use functional components with hooks
- Props destructuring in parameters: `function Component({ prop1, prop2 })`
- Export default at bottom
- Event handlers: `handleEventName` (e.g., `handleSubmit`)

#### State Management
- useState for local state
- useEffect for side effects
- useMemo for expensive calculations

#### API Calls
- Use axios via api.js configuration
- Base URL: `http://localhost:4000/api`

## Environment Variables

Backend `.env`:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment mode

## Git Workflow

- Do NOT commit unless explicitly asked
- Never commit .env files or secrets
- Check git status before making changes

## Common Patterns

### Backend Route Template
```javascript
const express = require('express');
const router = express.Router();
const Model = require('../models/Model');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const data = await Model.find();
    res.json(data);
  } catch (error) {
    console.log('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### React Component Template
```javascript
import React, { useState, useEffect } from 'react';
import './Component.css';

function ComponentName({ prop1, prop2 }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Side effect
  }, []);

  const handleEvent = () => {
    // Handler logic
  };

  return (
    <div className="component-class">
      {/* JSX */}
    </div>
  );
}

export default ComponentName;
```

## Important Notes

- Backend runs on port 4000, frontend on port 3000
- Socket.io used for real-time features
- JWT tokens expire in 1 hour
- MongoDB uses Mongoose ODM
- CORS enabled for all origins in development
