# Treege Examples

This directory contains examples for testing Treege in different environments.

## Structure

```
example/
├── web/                          # Web examples (React)
│   ├── Example.tsx              # Main example
│   ├── CustomInputExample.tsx   # Custom input example
│   └── TreegeRendererProviderExample.tsx
├── native/                      # React Native examples
│   ├── App.tsx                  # Main React Native example
│   └── ...                      # Expo project files
└── json/                        # Shared JSON flow definitions
    ├── treege.json
    └── treege-all-inputs.json
```

## Running Examples

### Web Example

From the root of the repository:

```bash
bun run example
```

This will start the Vite dev server and open the web example at `/example`.

### React Native Example

From the root of the repository:

```bash
bun run example:native
```

This will start the Expo dev server. Then:
- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Press `w` to open in web browser
- Scan the QR code with Expo Go app on your phone

## JSON Flows

The `json/` directory contains shared flow definitions that can be used in both web and native examples:

- **treege.json** - Basic example flow
- **treege-all-inputs.json** - Complete example with all input types

These files can be imported and used in both web and native examples to ensure consistency.
