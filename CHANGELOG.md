# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025

### 🎉 Major Release - Complete Rewrite

Version 3.0 represents a complete architectural overhaul of Treege, transforming it into a production-ready decision tree library with enhanced capabilities, better performance, and improved developer experience.

### ✨ New Features

#### Core Architecture
- **Modular Exports**: Three separate entry points (`treege`, `treege/editor`, `treege/renderer`) for optimal bundle size
- **Full TypeScript Rewrite**: Complete type safety with comprehensive TypeScript definitions
- **React 19 Support**: Full compatibility with React 18 and React 19
- **TailwindCSS 4**: Upgraded to the latest TailwindCSS version with improved performance

#### Visual Editor (`treege/editor`)
- **Enhanced Node System**: Four distinct node types (Flow, Group, Input, UI)
- **Conditional Edges**: Advanced conditional logic with AND/OR operators
- **Mini-map Navigation**: Improved navigation for complex decision trees
- **Theme Support**: Built-in dark/light mode with customizable backgrounds
- **Multi-language Support**: Complete translation system for internationalization

#### Runtime Renderer (`treege/renderer`)
- **16 Input Types**: Comprehensive input type system
  - text, number, textarea, password
  - select, radio, checkbox, switch, autocomplete
  - date, daterange, time, timerange
  - file, address, http, hidden
- **HTTP Integration**: Full-featured API integration
  - Response mapping with JSONPath
  - Search functionality
  - Request configuration
  - Enhanced error messages
- **Advanced Validation System**
  - Required field validation
  - Pattern matching with regex
  - Custom validation functions
  - Two validation modes: `onSubmit` and `onChange`
- **Security Features**
  - Built-in XSS protection with input sanitization
  - DOMPurify integration for secure HTML rendering
- **Component Customization**
  - Override any component (FormWrapper, Group, Inputs, SubmitButton, UI elements)
  - Custom input component support
  - Flexible theming system
- **Global Configuration Provider**
  - `TreegeRendererProvider` for global settings
  - Centralized language management
  - Google API key configuration
  - Shared component overrides
- **Programmatic Control**
  - `useTreegeRenderer` hook for form state management
  - Methods: `values`, `setFieldValue`, `submit`, `reset`
  - Full control over form lifecycle
- **Enhanced Form Features**
  - Dynamic field visibility based on conditions
  - Conditional edge evaluation
  - Value reference system for dependent fields
  - Ancestor value transmission

#### UI Components
- **Two UI Types**: Title and Divider for better content organization
- **Radix UI Integration**: Accessible, production-ready UI components
- **Responsive Design**: Mobile-first approach with responsive layouts

### 🔄 Breaking Changes

- **Removed JsonNode**: JsonNode type has been completely removed from the codebase
- **New Module Structure**: Import paths have changed
  - Old: `import { TreegeEditor } from "treege"`
  - New: `import { TreegeEditor } from "treege/editor"` or keep using `"treege"` for combined exports
- **Updated Props API**: TreegeRenderer and TreegeEditor props have been refined
- **Peer Dependencies**: Now requires TailwindCSS 4.x

### 🐛 Bug Fixes

- Fixed popover positioning issues
- Resolved CSS import and styling conflicts
- Fixed class order and removed unnecessary `!important` rules
- Improved form validation edge cases
- Enhanced error handling for HTTP requests

### 📚 Documentation

- Complete README rewrite with comprehensive examples
- Added CLAUDE.md for AI-assisted development guidance
- Detailed API reference for all components
- Example URLs and demo applications
- Migration guide from v2 to v3

### 🛠️ Developer Experience

- **Build System**: Vite-based build for faster development and smaller bundles
- **Testing**: Vitest integration for unit and integration tests
- **Linting**: Biome for fast, consistent code formatting
- **Type Safety**: Strict TypeScript configuration with zero compilation warnings
- **Examples**: Five comprehensive example applications
  - Default Example
  - Demo Example
  - All Inputs Example
  - Custom Input Example
  - TreegeRendererProvider Example

### 🎨 UI/UX Improvements

- Enhanced error messages for better user feedback
- Improved form field styling and accessibility
- Better visual feedback for validation states
- Smoother animations and transitions
- Optimized loading states for HTTP inputs

### 📦 Dependencies

#### Major Updates
- React: Support for 18.x and 19.x
- TailwindCSS: Upgraded to 4.1.x
- @xyflow/react: Updated to 12.9.2
- TypeScript: Upgraded to 5.9.x

#### New Dependencies
- DOMPurify: XSS protection
- @tanstack/react-form: Enhanced form management
- date-fns: Modern date handling
- cmdk: Command menu component
- sonner: Toast notifications

### 🔧 Technical Improvements

- **State Management**: Zustand for efficient state handling in the editor
- **Performance**: Optimized rendering with React.memo and useMemo
- **Bundle Size**: Tree-shakeable exports for smaller production bundles
- **CSS Strategy**: CSS-in-JS with Vite plugin for component styling
- **Type Guards**: Comprehensive type guards for runtime type safety

### 🌐 React Native Support

Version 3.0 introduces full React Native support with a dedicated renderer implementation.

#### Features
- **Separate Entry Point**: `treege/renderer-native` for React Native applications
- **Vanilla Components**: Built with React Native core components (no external dependencies required)
- **Shared Logic**: Core renderer logic shared between web and native through `useTreegeRenderer` hook
- **Platform-specific Optimizations**:
  - Optimized rendering with `useRenderNode` hook
  - Mobile-first UX (no intrusive auto-focus on validation errors)
  - Native ScrollView integration
  - React Native styling with StyleSheet
- **Component Architecture**:
  - DefaultFormWrapper, DefaultGroup, DefaultSubmitButton
  - Default implementations for all 16 input types
  - Easy to override with custom components
- **Unified API**: Same props interface as web renderer for consistency

#### Implementation Details
- **Single Source Directory**: All renderer code (web and native) in `src/renderer/`
- **Platform Exports**: `index.ts` for web, `index.native.ts` for React Native
- **Shared Hooks**: `useTreegeRenderer` and `useRenderNode` work across both platforms
- **Type Safety**: Full TypeScript support with shared types

#### Usage
```tsx
import { TreegeRenderer } from "treege/renderer-native";

<TreegeRenderer
  flow={flow}
  onSubmit={(values) => console.log(values)}
/>
```

See the "React Native Support" section in the README for complete documentation.

### 📝 Migration from v2.x

To migrate from v2.x to v3.0:

1. Update your dependencies to React 18/19 and TailwindCSS 4
2. Update import paths to use modular exports if needed
3. Remove any usage of JsonNode
4. Update component props to match new API
5. Review and update custom validation functions
6. Test conditional logic with new edge system

For detailed migration steps, please refer to the migration guide in the documentation.

---

## [2.x] - Previous Versions

For changelog entries prior to v3.0, please refer to the git history or contact the maintainers.

---

**Full Changelog**: https://github.com/Tracktor/treege/compare/v2.0.0...v3.0.0
