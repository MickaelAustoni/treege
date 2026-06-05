import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ApiUrlCombobox from "../ApiUrlCombobox";

vi.mock("@/editor/hooks/useTranslate", () => ({
  default: () => (key: string) => key,
}));

const mockOpenApi = vi.fn();
vi.mock("@/editor/context/OpenApiContext", () => ({
  useOpenApi: () => mockOpenApi(),
}));

const setOpenApi = (value: { baseUrl: string; routes: unknown[] }) => {
  mockOpenApi.mockReturnValue(value);
};

afterEach(() => {
  cleanup();
  mockOpenApi.mockReset();
});

describe("ApiUrlCombobox", () => {
  it("stores a manually typed url verbatim, including absolute urls", () => {
    setOpenApi({ baseUrl: "https://api.example.com", routes: [] });
    const onChange = vi.fn();
    render(<ApiUrlCombobox value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "https://other-api.com/x" } });

    expect(onChange).toHaveBeenCalledWith("https://other-api.com/x");
  });

  it("keeps a relative url as typed", () => {
    setOpenApi({ baseUrl: "https://api.example.com", routes: [] });
    const onChange = vi.fn();
    render(<ApiUrlCombobox value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "/v2/items" } });

    expect(onChange).toHaveBeenCalledWith("/v2/items");
  });

  it("does not render a base URL prefix", () => {
    setOpenApi({ baseUrl: "https://api.example.com", routes: [] });
    render(<ApiUrlCombobox value="/v2/items" onChange={vi.fn()} />);

    expect(screen.queryByText("https://api.example.com")).toBeNull();
    expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe("/v2/items");
  });

  it("hides the route picker when no OpenAPI routes are available", () => {
    setOpenApi({ baseUrl: "", routes: [] });
    render(<ApiUrlCombobox value="" onChange={vi.fn()} />);

    expect(screen.queryByLabelText("editor.apiUrlCombobox.browseRoutes")).toBeNull();
  });

  it("prepends the base URL to a relative path via the toggle button", () => {
    setOpenApi({ baseUrl: "https://api.example.com", routes: [] });
    const onChange = vi.fn();
    render(<ApiUrlCombobox value="/v2/items" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("editor.apiUrlCombobox.applyBaseUrl"));

    expect(onChange).toHaveBeenCalledWith("https://api.example.com/v2/items");
  });

  it("strips the base URL back to a relative path via the toggle button", () => {
    setOpenApi({ baseUrl: "https://api.example.com", routes: [] });
    const onChange = vi.fn();
    render(<ApiUrlCombobox value="https://api.example.com/v2/items" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("editor.apiUrlCombobox.useRelativePath"));

    expect(onChange).toHaveBeenCalledWith("/v2/items");
  });

  it("hides the toggle button for an absolute URL pointing at another host", () => {
    setOpenApi({ baseUrl: "https://api.example.com", routes: [] });
    render(<ApiUrlCombobox value="https://other-api.com/x" onChange={vi.fn()} />);

    expect(screen.queryByLabelText("editor.apiUrlCombobox.applyBaseUrl")).toBeNull();
    expect(screen.queryByLabelText("editor.apiUrlCombobox.useRelativePath")).toBeNull();
  });

  it("hides the toggle button when no base URL is configured", () => {
    setOpenApi({ baseUrl: "", routes: [] });
    render(<ApiUrlCombobox value="/v2/items" onChange={vi.fn()} />);

    expect(screen.queryByLabelText("editor.apiUrlCombobox.applyBaseUrl")).toBeNull();
  });

  it("emits a relative path (not the absolute URL) when a route is picked from OpenAPI", () => {
    setOpenApi({
      baseUrl: "https://api.example.com",
      routes: [{ method: "GET", path: "/v2/items", summary: "List items" }],
    });
    const onChange = vi.fn();
    render(<ApiUrlCombobox value="" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("editor.apiUrlCombobox.browseRoutes"));
    fireEvent.click(screen.getByText("/v2/items"));

    expect(onChange).toHaveBeenCalledWith("/v2/items", "GET");
  });
});
