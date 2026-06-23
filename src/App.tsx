import CustomInputExample from "~/example/web/CustomInputExample";
import Example from "~/example/web/Example";
import TreegeRendererProviderExample from "~/example/web/TreegeRendererProviderExample";
import ViewerExample from "~/example/web/ViewerExample";

const App = () => {
  const { pathname } = window.location;

  if (pathname === "/example-treege-renderer-provider") {
    return <TreegeRendererProviderExample />;
  }

  if (pathname === "/example-viewer") {
    return <ViewerExample />;
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
