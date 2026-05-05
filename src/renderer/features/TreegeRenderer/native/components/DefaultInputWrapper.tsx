import { Node } from "@xyflow/react";
import { ReactNode } from "react";
import { Image, StyleSheet, View } from "react-native";
import { InputNodeData } from "@/shared/types/node";

interface DefaultInputWrapperProps {
  node: Node<InputNodeData>;
  children: ReactNode;
}

const DefaultInputWrapper = ({ node, children }: DefaultInputWrapperProps) => {
  const { image } = node.data;

  return (
    <View>
      {image && <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    borderRadius: 6,
    height: 160,
    marginBottom: 8,
    width: "100%",
  },
});

export default DefaultInputWrapper;
