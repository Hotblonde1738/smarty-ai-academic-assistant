# SmartyPants-AI Development Guide

## TypeScript Development Workflow

This project uses TypeScript for frontend development with automatic compilation to JavaScript for deployment.

### Development Commands

```bash
# Build TypeScript to JavaScript (for development)
npm run build:ts

# Build everything (TypeScript + Functions) for deployment
npm run build

# Watch mode - automatically recompile on changes
npm run watch

# Type checking only (no compilation)
npm run type-check

# Clean compiled JavaScript files
npm run clean

# Development workflow
npm run dev
```

### File Structure

- **Source files**: `public/js/services/*.ts` (TypeScript)
- **Compiled files**: `public/js/services/*.js` (JavaScript - auto-generated)
- **HTML loads**: JavaScript files (compiled from TypeScript)

### Development Workflow

1. **Edit TypeScript files** in `public/js/services/*.ts`
2. **Compile to JavaScript** with `npm run build:ts`
3. **Test locally** by opening `public/index.html` in browser
4. **Deploy to Netlify** - automatic build process compiles TypeScript

### Netlify Deployment

- Netlify automatically runs `npm run build` during deployment
- This compiles TypeScript to JavaScript
- The compiled JavaScript files are served to browsers

### Notes

- Compiled JavaScript files are in `.gitignore` (auto-generated)
- Always edit the `.ts` files, never the `.js` files
- Use `npm run watch` for automatic recompilation during development
