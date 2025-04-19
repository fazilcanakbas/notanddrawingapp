import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Dimensions, GestureResponderEvent, TouchableOpacity, Text, Alert, Image } from "react-native";
import { Canvas, Path, Skia, useCanvasRef } from "@shopify/react-native-skia";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import PdfViewer from "./PdfViewer";
import { saveNote, updateNote, getNote } from "../utils/storage";

const { width, height } = Dimensions.get("window");
const DRAW_AREA_SIZE = width * 0.92;
const DRAW_AREA_HEIGHT = height * 0.5;

const COLORS = ["#222", "#e74c3c", "#3498db", "#27ae60", "#f1c40f", "#9b59b6", "#fff"];
const STROKE_WIDTHS = [2, 4, 8, 12];

type SkiaPath = ReturnType<typeof Skia.Path.Make>;
type DrawPath = {
  path: SkiaPath;
  color: string;
  strokeWidth: number;
};
type Props = {
  pdfUri?: string;
  noteId?: string;
  initialImageUri?: string;
  navigation: any;
  isEditing?: boolean;
};

export default function DrawingPad({ pdfUri, noteId, initialImageUri, navigation, isEditing }: Props) {
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawPath | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState(STROKE_WIDTHS[1]);
  const [isErasing, setIsErasing] = useState(false);
  const canvasRef = useCanvasRef();

  // Galeri izinleri
  const [hasMediaPermission, requestPermission] = MediaLibrary.usePermissions();

  // Notu açıp, paths'i yükle
  useEffect(() => {
    if (initialImageUri) {
      // Yüklü resmi arka plana yerleştirmek için, advanced Skia kullanımı gerekebilir.
      // Basitlik için sadece paths ile başlatıyoruz (gelişmiş için ayrı destek gerekir)
    }
    if (noteId && !paths.length) {
      getNote(noteId).then((note) => {
        // pdf ile kaydedildiyse paths'i yükleyebilirsin, burada sadece image gösterimi var
      });
    }
  }, [noteId]);

  useEffect(() => {
    if (isErasing) {
      setSelectedColor("#fff");
      setSelectedStrokeWidth(16);
    }
  }, [isErasing]);

  const handleTouchStart = (event: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = event.nativeEvent;
    const newPath = Skia.Path.Make();
    newPath.moveTo(x, y);
    setCurrentPath({
      path: newPath,
      color: isErasing ? "#fff" : selectedColor,
      strokeWidth: isErasing ? 16 : selectedStrokeWidth,
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

  // Uygulamaya kaydet
  const handleSaveApp = async () => {
    try {
      const image = await canvasRef.current?.makeImageSnapshot();
      if (!image) throw new Error("Çizim yakalanamadı!");
      const pngData = image.encodeToBase64();
      const fileUri = FileSystem.cacheDirectory + `drawing_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(fileUri, pngData, { encoding: FileSystem.EncodingType.Base64 });

      if (noteId && isEditing) {
        await updateNote(noteId, { imageUri: fileUri, pdfUri });
        Alert.alert("Başarılı", "Not güncellendi!");
      } else {
        await saveNote({ imageUri: fileUri, pdfUri });
        Alert.alert("Başarılı", "Not kaydedildi!");
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert("Hata", "Kaydedilirken bir hata oluştu: " + (err as Error).message);
    }
  };

  // Galeriye kaydet
  const handleSaveGallery = async () => {
    if (!hasMediaPermission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("İzin gerekli", "Kaydetmek için galeri izni vermelisiniz!");
        return;
      }
    }
    try {
      const image = await canvasRef.current?.makeImageSnapshot();
      if (!image) throw new Error("Çizim yakalanamadı!");
      const pngData = image.encodeToBase64();
      const fileUri = FileSystem.cacheDirectory + `drawing_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(fileUri, pngData, { encoding: FileSystem.EncodingType.Base64 });
      await MediaLibrary.createAssetAsync(fileUri);
      Alert.alert("Başarılı", "Galeriye kaydedildi!");
    } catch (err) {
      Alert.alert("Hata", "Kaydedilirken bir hata oluştu: " + (err as Error).message);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{isEditing ? "Notu Düzenle" : "El Yazısı Not Defteri"}</Text>
      <View style={styles.toolbar}>
        <View style={styles.row}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorCircle,
                {
                  backgroundColor: color,
                  borderColor: selectedColor === color && !isErasing ? "#444" : "#ccc",
                  borderWidth: 2,
                  opacity: isErasing && color !== "#fff" ? 0.4 : 1,
                },
              ]}
              onPress={() => {
                setSelectedColor(color);
                setIsErasing(false);
              }}
            />
          ))}
          <TouchableOpacity
            style={[
              styles.colorCircle,
              {
                backgroundColor: "#fff",
                borderColor: isErasing ? "#f33" : "#ccc",
                borderWidth: 2,
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
            onPress={() => setIsErasing(!isErasing)}
          >
            <Text style={{ color: isErasing ? "#f33" : "#999", fontWeight: "bold" }}>Silgi</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          {STROKE_WIDTHS.map((sw) => (
            <TouchableOpacity key={sw} style={styles.strokeBtn} onPress={() => { setSelectedStrokeWidth(sw); setIsErasing(false); }}>
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
        {pdfUri && <PdfViewer uri={pdfUri} style={styles.pdfViewer} />}
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
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#4caf50" }]} onPress={handleSaveApp}>
          <Text style={[styles.actionText, { color: "#fff" }]}>Uygulamaya Kaydet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleSaveGallery}>
          <Text style={[styles.actionText, { color: "#fff" }]}>Galerieye Kaydet</Text>
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
    overflow: "hidden",
  },
  pdfViewer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: DRAW_AREA_SIZE,
    height: DRAW_AREA_HEIGHT,
    zIndex: 0,
  },
  canvas: {
    width: DRAW_AREA_SIZE,
    height: DRAW_AREA_HEIGHT,
    borderRadius: 16,
    backgroundColor: "transparent",
    position: "absolute",
    zIndex: 1,
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
    paddingHorizontal: 18,
    borderRadius: 10,
    marginHorizontal: 8,
    elevation: 2,
  },
  saveBtn: {
    backgroundColor: "#5561fa",
    elevation: 3,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#32325d",
    letterSpacing: 0.4,
  },
});