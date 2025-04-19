import React, { useState, useRef } from "react";
import { View, StyleSheet, Dimensions, GestureResponderEvent, TouchableOpacity, Text, Alert } from "react-native";
import { Canvas, Path, Skia, useCanvasRef } from "@shopify/react-native-skia";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";

const { width, height } = Dimensions.get("window");
const DRAW_AREA_SIZE = width * 0.92;
const DRAW_AREA_HEIGHT = height * 0.5;

type SkiaPath = ReturnType<typeof Skia.Path.Make>;

const COLORS = ["#222", "#e74c3c", "#3498db", "#27ae60", "#f1c40f", "#9b59b6", "#fff"];
const STROKE_WIDTHS = [2, 4, 8, 12];

type DrawPath = {
  path: SkiaPath;
  color: string;
  strokeWidth: number;
};

export default function DrawingScreen({}) {

  
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawPath | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState(STROKE_WIDTHS[1]);
  const canvasRef = useCanvasRef();

  // Galeri izinleri
  const [hasMediaPermission, requestPermission] = MediaLibrary.usePermissions();

  const handleTouchStart = (event: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = event.nativeEvent;
    const newPath = Skia.Path.Make();
    newPath.moveTo(x, y);
    setCurrentPath({
      path: newPath,
      color: selectedColor,
      strokeWidth: selectedStrokeWidth,
    });
  };

  const handleTouchMove = ({ nativeEvent }: { nativeEvent: GestureResponderEvent['nativeEvent'] }) => {
    if (!currentPath) return;
    const { locationX: x, locationY: y } = nativeEvent;
    currentPath.path.lineTo(x, y);
    setCurrentPath({
      ...currentPath,
      path: currentPath.path.copy(),
    });
  };

  const handleTouchEnd = () => {
    if (currentPath) {
      setPaths([...paths, currentPath]);
      setCurrentPath(null);
    }
  };

  const handleClear = () => {
    setPaths([]);
    setCurrentPath(null);
  };

  const handleSave = async () => {
    if (!hasMediaPermission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("İzin gerekli", "Kaydetmek için galeri izni vermelisiniz!");
        return;
      }
    }
    try {
      // Canvas'ı PNG olarak kaydet
      const image = await canvasRef.current?.makeImageSnapshot();
      if (!image) throw new Error("Çizim yakalanamadı!");

      const pngData = image.encodeToBase64();
      const fileUri = FileSystem.cacheDirectory + `drawing_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(fileUri, pngData, { encoding: FileSystem.EncodingType.Base64 });

      const asset = await MediaLibrary.createAssetAsync(fileUri);

      Alert.alert("Başarılı", "Çizim galeriye kaydedildi!");
    } catch (err) {
      Alert.alert("Hata", "Kaydedilirken bir hata oluştu: " + (err as Error).message);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>El Yazısı Not Defteri</Text>
      <View style={styles.toolbar}>
        <View style={styles.row}>
          {/* Renk seçenekleri */}
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorCircle, { backgroundColor: color, borderColor: selectedColor === color ? "#444" : "#ccc" }]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>
        <View style={styles.row}>
          {/* Kalem kalınlığı seçenekleri */}
          {STROKE_WIDTHS.map((sw) => (
            <TouchableOpacity key={sw} style={styles.strokeBtn} onPress={() => setSelectedStrokeWidth(sw)}>
              <View
                style={{
                  width: sw * 2,
                  height: sw * 2,
                  backgroundColor: selectedColor,
                  borderRadius: sw,
                  borderWidth: selectedStrokeWidth === sw ? 2 : 0,
                  borderColor: "#222",
                  margin: 2,
                }}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.drawingArea}>
        <Canvas
          ref={canvasRef}
          style={styles.canvas}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {paths.map((p, i) => (
            <Path
              key={i}
              path={p.path}
              color={p.color}
              style="stroke"
              strokeWidth={p.strokeWidth}
              strokeJoin="round"
              strokeCap="round"
            />
          ))}
          {currentPath && (
            <Path
              path={currentPath.path}
              color={currentPath.color}
              style="stroke"
              strokeWidth={currentPath.strokeWidth}
              strokeJoin="round"
              strokeCap="round"
            />
          )}
        </Canvas>
      </View>
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleClear}>
          <Text style={styles.actionText}>Temizle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleSave}>
          <Text style={[styles.actionText, { color: "#fff" }]}>Kaydet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f6f7fb",
    alignItems: "center",
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#32325d",
    letterSpacing: 0.6,
  },
  toolbar: {
    width: DRAW_AREA_SIZE,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#0003",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 6,
    borderWidth: 2,
  },
  strokeBtn: {
    marginHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  drawingArea: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e5e7ec",
    marginVertical: 14,
    elevation: 2,
    shadowColor: "#0002",
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  canvas: {
    width: DRAW_AREA_SIZE,
    height: DRAW_AREA_HEIGHT,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    width: DRAW_AREA_SIZE,
  },
  actionBtn: {
    backgroundColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginHorizontal: 12,
    elevation: 2,
  },
  saveBtn: {
    backgroundColor: "#5561fa",
    elevation: 3,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#32325d",
    letterSpacing: 0.4,
  },
});