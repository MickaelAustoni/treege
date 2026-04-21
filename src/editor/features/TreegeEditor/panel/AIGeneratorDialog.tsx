import { Edge, Node } from "@xyflow/react";
import { Loader2, WandSparkles } from "lucide-react";
import { KeyboardEvent, useState } from "react";
import { toast } from "sonner";
import useTranslate from "@/editor/hooks/useTranslate";
import { AIConfig } from "@/editor/types/ai";
import { generateFlowWithAI } from "@/editor/utils/aiFlowGenerator";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";

export interface AIGeneratorDialogProps {
  /**
   * AI configuration from context
   */
  aiConfig?: AIConfig;
  /**
   * Callback when tree is generated
   */
  onGenerate: (data: { edges: Edge[]; nodes: Node[] }) => void;
}

export const AIGeneratorDialog = ({ aiConfig, onGenerate }: AIGeneratorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useTranslate();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(t("editor.aiGenerator.enterDescription"));
      return;
    }

    if (!aiConfig?.apiKey) {
      toast.error(t("editor.aiGenerator.missingApiKey"), {
        description: t("editor.aiGenerator.missingApiKeyDesc"),
      });
      return;
    }

    setLoading(true);

    try {
      const result = await generateFlowWithAI({
        config: aiConfig,
        prompt: prompt.trim(),
      });

      onGenerate({
        edges: result.edges,
        nodes: result.nodes,
      });

      toast.success(t("editor.aiGenerator.successTitle"), {
        description: t("editor.aiGenerator.successDescription")
          .replace("{nodes}", String(result.nodes.length))
          .replace("{edges}", String(result.edges.length)),
      });

      // Reset and close
      setPrompt("");
      setOpen(false);
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error(t("editor.aiGenerator.failedToGenerate"), {
        description: error instanceof Error ? error.message : t("editor.aiGenerator.unknownError"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleGenerate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!aiConfig?.apiKey}>
          <WandSparkles className="h-4 w-4 text-[#13d3b4]" /> {t("editor.aiGenerator.buttonLabel")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]!">
        <DialogHeader>
          <DialogTitle>{t("editor.aiGenerator.title")}</DialogTitle>
          <DialogDescription>{t("editor.aiGenerator.titleDescription")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="ai-prompt" className="font-medium text-sm">
              {t("editor.aiGenerator.description")}
            </label>
            <Textarea
              placeholder={t("editor.aiGenerator.descriptionPlaceholder")}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={6}
              disabled={loading}
              className="resize-none"
            />
            <p className="text-muted-foreground text-xs">
              {t("editor.aiGenerator.keyboardShortcut").replace("{cmdEnter}", "⌘ Enter").replace("{ctrlEnter}", "Ctrl Enter")}
            </p>
          </div>

          {!aiConfig?.apiKey && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">{t("editor.aiGenerator.aiNotConfigured")}</p>
              <p className="mt-1 text-muted-foreground text-xs">
                {t("editor.aiGenerator.aiNotConfiguredDesc").replace("{code}", "")}{" "}
                <code className="rounded bg-background px-1 py-0.5">aiConfig</code>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {t("editor.aiGenerator.cancel")}
          </Button>
          <Button onClick={handleGenerate} disabled={loading || !prompt.trim() || !aiConfig?.apiKey}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("editor.aiGenerator.generating")}
              </>
            ) : (
              <>
                <WandSparkles className="h-4 w-4 text-[--treege-color-primary]" />
                {t("editor.aiGenerator.generate")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
