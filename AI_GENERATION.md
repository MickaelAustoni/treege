# AI Tree Generation

Treege supports AI-powered tree generation to quickly create decision trees and forms from natural language descriptions.

## Features

- **Multi-Provider Support**: Works with Gemini, OpenAI, DeepSeek, and Claude
- **Natural Language Input**: Describe your form in plain text
- **Instant Generation**: Creates complete node and edge structures
- **Smart Defaults**: Automatically adds validation, placeholders, and proper field types

## Quick Start

### 1. Get an API Key

Choose one of these providers (Gemini recommended for best price/performance):

| Provider     | Get API Key                                             | Free Tier          | Cost (per 1M tokens)                     |
|--------------|---------------------------------------------------------|--------------------|------------------------------------------|
| **Gemini** ⭐ | [Google AI Studio](https://aistudio.google.com/)        | 1,500 requests/day | $0.075 input / $0.30 output              |
| OpenAI       | [OpenAI Platform](https://platform.openai.com/api-keys) | $5 initial credit  | $0.15 input / $0.60 output (GPT-4o-mini) |
| DeepSeek     | [DeepSeek Platform](https://platform.deepseek.com/)     | None               | $0.27 input / $1.10 output               |
| Claude       | [Anthropic Console](https://console.anthropic.com/)     | None               | $0.80 input / $4.00 output (Haiku)       |

### 2. Configure TreegeEditor

Add the `aiConfig` prop to your `TreegeEditor` component:

```tsx
import { TreegeEditor } from "treege/editor";

function App() {
  return (
    <TreegeEditor
      aiConfig={{
        provider: "gemini", // or "openai", "deepseek", "claude"
        apiKey: "your-api-key-here",
        model: "gemini-2.5-flash", // optional, uses default if not specified
        temperature: 0.3 // optional, default is 0.7
      }}
      onSave={(flow) => console.log(flow)}
    />
  );
}
```

### 3. Use the AI Generator

1. Click the **wand sparkles icon** (🪄) button next to "Add Node"
2. Describe what you want to create
3. Click "Generate" or press `Cmd/Ctrl + Enter`

## Examples

### Simple Contact Form

```
Create a contact form with name, email and message
```

**Result**: 3 input nodes (text, email, textarea) with validation

### User Registration

```
Create a registration form with age, address and country selector
```

**Result**: Age (number), Address (address field), Country (select dropdown)

### Survey Form

```
Create a customer satisfaction survey with:
- Rating (1-5 stars)
- Would you recommend us (yes/no)
- Additional comments
```

**Result**: Number input, radio buttons, textarea

### Complex Form

```
Create an event registration form with:
- Event name
- Event date and time
- Location (with address lookup)
- Number of attendees (1-100)
- Dietary restrictions (multiple choice: vegetarian, vegan, gluten-free, none)
- Special requests
```

**Result**: Complete form with 6+ fields, proper types, validation

## Configuration Options

### AIConfig Interface

```typescript
interface AIConfig {
  provider?: "gemini" | "openai" | "deepseek" | "claude";
  apiKey: string;
  model?: string; // Optional model override
  temperature?: number; // 0-1, controls randomness (default: 0.7)
}
```

### Default Models

If you don't specify a model, these defaults are used:

- **Gemini**: `gemini-2.5-flash` (fast, cheap, recommended)
- **OpenAI**: `gpt-4o-mini` (good balance)
- **DeepSeek**: `deepseek-chat` (code-specialized)
- **Claude**: `claude-3-5-haiku-20241022` (high quality)

### Environment Variables

For development, use environment variables:

```bash
# .env
VITE_AI_API_KEY=your-api-key-here
```

```tsx
<TreegeEditor
  aiConfig={{
    provider: "gemini",
    apiKey: import.meta.env.VITE_AI_API_KEY,
  }}
/>
```

## Supported Field Types

The AI can generate all 16 input types:

- `text`, `number`, `textarea`, `password`
- `select`, `radio`, `checkbox`, `switch`
- `autocomplete`, `date`, `daterange`, `time`, `timerange`
- `file`, `address`, `http`, `hidden`

Plus 2 UI types:
- `title`, `divider`

## Tips for Best Results

### Be Specific

❌ "Create a form"
✅ "Create a contact form with name, email, phone and message"

### Mention Field Types

❌ "Add a date field"
✅ "Add a date range picker for start and end dates"

### Include Validation

❌ "Email field"
✅ "Email field with validation"

### Use Lists for Complex Forms

```
Create a job application form with:
- Personal info: name, email, phone
- Experience: years of experience (number), current role
- Skills: programming languages (multiple choice)
- Availability: start date
- Cover letter (long text)
```

## Error Handling

If generation fails:

1. **Check API Key**: Make sure it's valid and not expired
2. **Check Provider**: Verify you're using the correct provider name
3. **Check Console**: Look for detailed error messages
4. **Try Again**: Sometimes API calls fail temporarily

Common errors:

```
"AI configuration missing" → Add aiConfig prop to TreegeEditor
"Invalid API key" → Check your API key is correct
"Rate limit exceeded" → Wait a few moments, or upgrade your plan
```

## Pricing Estimates

Based on average usage (1600 tokens per generation):

| Provider     | Cost per generation | 1000 generations |
|--------------|--------------------:|-----------------:|
| Gemini Flash |             $0.0006 |            $0.60 |
| DeepSeek     |             $0.0010 |            $1.00 |
| GPT-4o-mini  |             $0.0010 |            $1.00 |
| Claude Haiku |             $0.0060 |            $6.00 |

**Note**: Gemini offers 1,500 free requests per day, making it essentially free for most use cases.

## Security Best Practices

### Never Commit API Keys

```bash
# Add to .gitignore
.env
.env.local
```

### Use Environment Variables

```tsx
// ✅ Good
apiKey: import.meta.env.VITE_AI_API_KEY

// ❌ Bad
apiKey: "sk-1234567890abcdef"
```

### Server-Side Proxy (Recommended for Production)

For production apps, proxy AI requests through your backend:

```tsx
// Frontend
<TreegeEditor
  aiConfig={{
    provider: "gemini",
    apiKey: "use-backend-proxy", // Not a real API key
    // Add custom endpoint in service
  }}
/>
```

Then modify `src/editor/utils/aiFlowGenerator.ts` to call your backend instead of AI providers directly.

## Multi-Language Support

The AI Generator dialog is fully translated and supports 7 languages:

- 🇬🇧 English (en)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇪🇸 Spanish (es)
- 🇮🇹 Italian (it)
- 🇵🇹 Portuguese (pt)
- 🇸🇦 Arabic (ar)

The dialog automatically uses the same language as your `TreegeEditor`:

```tsx
<TreegeEditor
  language="fr" // Dialog will be in French
  aiConfig={{ provider: "gemini", apiKey: "..." }}
/>
```

## TypeScript Support

Full TypeScript support with autocomplete:

```typescript
import { AIConfig, AIProvider } from "treege/editor";

const config: AIConfig = {
  provider: "gemini", // Autocompleted!
  apiKey: process.env.AI_KEY!,
  model: "gemini-2.5-flash", // Type-safe model names
  temperature: 0.7,
};
```

## Troubleshooting

### Button is Disabled

The wand sparkles button is disabled when:
- No `aiConfig` is provided
- `apiKey` is empty or undefined

**Fix**: Add valid `aiConfig` to TreegeEditor

### Poor Generation Quality

- **Lower temperature** (0.3-0.5) for more consistent results
- **Be more specific** in your prompt
- **Try a different provider** (Claude > GPT-4o > Gemini > DeepSeek for quality)

### "No response from AI"

- Check your internet connection
- Verify API endpoint is accessible
- Check API provider status page

## Advanced Usage

### Custom System Prompts

To customize how the AI generates flow, edit `src/editor/utils/aiFlowGenerator.ts`:

```typescript
const SYSTEM_PROMPT = `Your custom instructions here...`;
```

### Adding New Providers

To add a new AI provider:

1. Add to `AIProvider` type in `src/editor/types/ai.ts`
2. Add generation function in `src/editor/utils/aiFlowGenerator.ts`
3. Add to switch statement in `generateFlowWithAI`

## Contributing

Found a bug or want to improve AI generation?

1. Open an issue: [GitHub Issues](https://github.com/MickaelAustoni/treege/issues)
2. Submit a PR with improvements to prompts or error handling
3. Share example prompts that work well

## License

Same as Treege main library.
