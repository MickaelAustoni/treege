# Treege React Native Example

This is a test application for the Treege React Native renderer.

## Getting Started

From the root of the monorepo:

```bash
# Start the Expo development server
yarn example:native

# Or from this directory
bun start
```

Then:
- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Press `w` to open in web browser
- Scan the QR code with Expo Go app on your phone

## Features Tested

This example renders every field type of the renderer on a single scrollable screen. The flow lives in
`allFieldsFlow.ts`: no group and no conditional edge, so nothing is hidden behind a step or an answer.

- **Text fields**: text, number, password (with show/hide toggle), textarea
- **Choices**: select (single and multiple), autocomplete, radio (card and default variants), checkbox (group and single), switch
- **Date & time**: date, date range (past dates disabled), time, time range
- **Advanced**: address, file, HTTP (select fetched on mount, and search-as-you-type)
- **UI elements**: title, divider
- **Not displayed**: hidden (its value shows up in the submitted values) and submit (gives its label to the submit button)

## Development

This app imports directly from the Treege source files (`../../src/renderer-native`), so any changes you make to the components will be reflected immediately with hot reload.

The path aliases are configured in:
- `tsconfig.json` - For TypeScript
- `babel.config.js` - For Metro bundler runtime
