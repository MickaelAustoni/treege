import CustomInputExample from "~/example/web/CustomInputExample";
import Example from "~/example/web/Example";
import TreegeRendererProviderExample from "~/example/web/TreegeRendererProviderExample";

const App = () => {
  const { pathname } = window.location;

  if (pathname === "/example-treege-renderer-provider") {
    return <TreegeRendererProviderExample />;
  }

  if (pathname === "/example-custom-input") {
    return <CustomInputExample />;
  }

  if (pathname === "/example-all-inputs") {
    return <Example all />;
  }

  if (pathname === "/example") {
    return <Example demo />;
  }
  return <Example />;
};

export default App;
