import React from "react";
import { View, StyleSheet, Dimensions, ViewStyle } from "react-native";
import Pdf from "react-native-pdf";

const { width } = Dimensions.get("window");
const DRAW_AREA_SIZE = width * 0.92;
const DRAW_AREA_HEIGHT = 400;

type PdfViewerProps = {
  uri: string;
  style?: ViewStyle;
};

export default function PdfViewer({ uri, style }: PdfViewerProps) {
  return (
    <View style={[styles.container, style]}>
      <Pdf
        source={{ uri }}
        style={styles.pdf}
        scale={1.0}
        spacing={0}
        minScale={1.0}
        maxScale={3.0}
        fitPolicy={0}
        trustAllCerts={true}
        enablePaging={false}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    width: DRAW_AREA_SIZE,
    height: DRAW_AREA_HEIGHT,
    backgroundColor: "#fff",
    overflow: "hidden",
    borderRadius: 16,
  },
  pdf: {
    flex: 1,
    width: DRAW_AREA_SIZE,
    height: DRAW_AREA_HEIGHT,
    borderRadius: 16,
  },
});