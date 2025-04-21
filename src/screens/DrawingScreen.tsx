import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Dimensions, GestureResponderEvent, TouchableOpacity, Text, Alert, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { Canvas, Path, Skia, useCanvasRef, Image, useImage } from "@shopify/react-native-skia";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import PdfViewer from "../components/PdfViewer";
import { saveNote, getNote, updateNote } from "../utils/storage";

const { width, height } = Dimensions.get("window");
const DRAW_AREA_SIZE = width * 0.92;
const DRAW_AREA_HEIGHT = height * 0.5;
const MAX_CANVAS_HEIGHT = height * 4; 

type SkiaPath = ReturnType<typeof Skia.Path.Make>;

const COLORS = ["#ff9eb6", "#4cd964", "#5ac8fa", "#007aff", "#ff3b30", "#ffcc00", "#000000", "#ffffff"];
const STROKE_WIDTHS = [2, 4, 8, 12, 16];

enum DrawMode {
  DRAW = "draw",
  NAVIGATE = "navigate"
}

type DrawPath = {
  path: SkiaPath;
  color: string;
  strokeWidth: number;
};

const generateSimpleId = () => {
  return Date.now().toString() + Math.floor(Math.random() * 10000).toString();
};

export default function DrawingScreen({ route, navigation }) {
  const pdfUri = route?.params?.pdfUri;
  const noteId = route?.params?.noteId;
  const isEditing = route?.params?.isEditing || false;
  const initialImageUri = route?.params?.initialImageUri;
  
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawPath | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[6]); // Default black
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState(STROKE_WIDTHS[1]);
  const [showDotGrid, setShowDotGrid] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showPencilOptions, setShowPencilOptions] = useState(false);
  const [undoStack, setUndoStack] = useState<DrawPath[]>([]);
  const [noteTitle, setNoteTitle] = useState("Yeni Not");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loadedImageUri, setLoadedImageUri] = useState<string | null>(null);
  const [existingNote, setExistingNote] = useState<any>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>(DrawMode.DRAW);
  const [canvasHeight, setCanvasHeight] = useState(MAX_CANVAS_HEIGHT);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  
  const canvasRef = useCanvasRef();
  const backgroundImage = useImage(initialImageUri);
  const scrollViewRef = useRef(null);

  const [hasMediaPermission, requestPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    const loadNote = async () => {
      if (noteId) {
        try {
          const note = await getNote(noteId);
          if (note) {
            setExistingNote(note);
            setNoteTitle(note.title || "Düzenlenen Not");
            
            setPaths([]);
            
            if (note.imageUri) {
              setLoadedImageUri(note.imageUri);
            }
            
            if (note.paths && Array.isArray(note.paths) && note.paths.length > 0) {
              try {
                const restoredPaths = note.paths.map(pathData => {
                  if (!pathData.svgPath) return null;
                  const skPath = Skia.Path.MakeFromSVGString(pathData.svgPath);
                  if (skPath) {
                    return {
                      path: skPath,
                      color: pathData.color || "#000000",
                      strokeWidth: pathData.strokeWidth || 4
                    };
                  }
                  return null;
                }).filter(p => p !== null);
                
                if (restoredPaths.length > 0) {
                  setPaths(restoredPaths);
                }
              } catch (err) {
                console.error("Çizim verisi yüklenirken hata oluştu:", err);
                setPaths([]);
              }
            }
          }
        } catch (err) {
          console.error("Not yüklenirken hata oluştu:", err);
          Alert.alert("Hata", "Not yüklenirken bir sorun oluştu.");
        }
      }
    };
    
    loadNote();
  }, [noteId]);

  useEffect(() => {
    if (pdfUri) {
      setPdfLoading(true);
      setPdfError(null);
      console.log("PDF URI ayarlandı:", pdfUri);
    }
  }, [pdfUri]);

  const handlePdfLoaded = () => {
    console.log("PDF başarıyla yüklendi!");
    setPdfLoading(false);
    setPdfError(null);
  };

  const handlePdfError = (error) => {
    console.error("PDF yükleme hatası:", error);
    setPdfLoading(false);
    setPdfError(error);
  };

  const handleTouchStart = (event: GestureResponderEvent) => {
    if (drawMode === DrawMode.NAVIGATE) return;
    
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
    if (drawMode === DrawMode.NAVIGATE || !currentPath) return;
    
    const { locationX: x, locationY: y } = nativeEvent;
    currentPath.path.lineTo(x, y);
    setCurrentPath({
      ...currentPath,
      path: currentPath.path.copy(),
    });
  };

  const handleTouchEnd = () => {
    if (drawMode === DrawMode.NAVIGATE || !currentPath) return;
    
    setPaths([...paths, currentPath]);
    setUndoStack([]); 
    setCurrentPath(null);
  };

  const handleClear = () => {
    Alert.alert(
      "Çizimi Temizle",
      "Tüm çizimler silinecek. Emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { text: "Temizle", onPress: () => {
            setPaths([]);
            setUndoStack([]);
            setCurrentPath(null);
          }
        }
      ]
    );
  };

  const toggleNavigationMode = () => {
    setDrawMode(drawMode === DrawMode.DRAW ? DrawMode.NAVIGATE : DrawMode.DRAW);
    setShowColorPalette(false);
    setShowPencilOptions(false);
    setShowDotGrid(false);
  };

  const handleScroll = (event) => {
    setScrollPosition(event.nativeEvent.contentOffset.y);
  };
// Bu satırı kaldırın:
const pdfViewerRef = useRef(null);
  const handleUndo = () => {
    if (paths.length === 0) return;
    
    const lastPath = paths[paths.length - 1];
    const newPaths = paths.slice(0, -1);
    
    setUndoStack([...undoStack, lastPath]);
    setPaths(newPaths);
  };

  const handleRedo = () => {
    if (undoStack.length === 0) return;
    
    const lastUndo = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    
    setUndoStack(newUndoStack);
    setPaths([...paths, lastUndo]);
  };

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

      const asset = await MediaLibrary.createAssetAsync(fileUri);
      Alert.alert("Başarılı", "Çizim galeriye kaydedildi!");
    } catch (err) {
      Alert.alert("Hata", "Kaydedilirken bir hata oluştu: " + (err as Error).message);
    }
  };

  const handleSaveToApp = async () => {
    setShowSaveDialog(true);
  };

  const completeSaveToApp = async () => {
    try {
      const image = await canvasRef.current?.makeImageSnapshot();
      if (!image) throw new Error("Çizim yakalanamadı!");

      const pngData = image.encodeToBase64();
      const fileUri = FileSystem.cacheDirectory + `drawing_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(fileUri, pngData, { encoding: FileSystem.EncodingType.Base64 });
      
      const serializedPaths = paths.map(p => ({
        svgPath: p.path.toSVGString(),
        color: p.color,
        strokeWidth: p.strokeWidth
      }));

      if (isEditing && noteId) {
        await updateNote(noteId, {
          title: noteTitle,
          imageUri: fileUri,
          pdfUri: pdfUri || existingNote?.pdfUri,
          paths: serializedPaths,
          updatedAt: new Date().toISOString()
        });
        Alert.alert("Başarılı", "Not güncellendi!");
      } else {
        
        const note = {
          title: noteTitle,
          imageUri: fileUri,
          pdfUri: pdfUri || null,
          paths: serializedPaths,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          id: generateSimpleId(),
        };
        
        await saveNote(note);
        Alert.alert("Başarılı", "Not kaydedildi!");
      }
      
      setShowSaveDialog(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert("Hata", "Kaydedilirken bir hata oluştu: " + (err as Error).message);
    }
  };

  const toggleDotGrid = () => {
    setShowDotGrid(!showDotGrid);
    setShowColorPalette(false);
    setShowPencilOptions(false);
  };

  const toggleColorPalette = () => {
    setShowColorPalette(!showColorPalette);
    setShowDotGrid(false);
    setShowPencilOptions(false);
  };

  const togglePencilOptions = () => {
    setShowPencilOptions(!showPencilOptions);
    setShowDotGrid(false);
    setShowColorPalette(false);
  };

  const DotGrid = () => {
    const rows = Math.ceil(canvasHeight / 30); 
    const cols = 20;
    const dotElements = [];
    const dotSize = 2;
    const spacing = DRAW_AREA_SIZE / cols;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        dotElements.push(
          <View
            key={`${i}-${j}`}
            style={{
              position: "absolute",
              left: j * spacing,
              top: i * spacing,
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: "#000",
              opacity: 0.2,
            }}
          />
        );
      }
    }
    return <>{dotElements}</>;
  };

  const memoizedPaths = React.useMemo(() => {
    return paths.map((p, i) => (
      <Path
        key={i}
        path={p.path}
        color={p.color}
        style="stroke"
        strokeWidth={p.strokeWidth}
        strokeJoin="round"
        strokeCap="round"
      />
    ));
  }, [paths]);

  return (
    <View style={styles.wrapper}>
      {showSaveDialog && (
        <View style={styles.saveDialogOverlay}>
          <View style={styles.saveDialog}>
            <Text style={styles.dialogTitle}>{isEditing ? "Notu Güncelle" : "Notu Kaydet"}</Text>
            <TextInput
              style={styles.titleInput}
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholder="Not başlığı giriniz"
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity 
                style={[styles.dialogButton, { backgroundColor: "#eee" }]} 
                onPress={() => setShowSaveDialog(false)}
              >
                <Text style={{ color: "#333" }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dialogButton, { backgroundColor: "#5561fa" }]} 
                onPress={completeSaveToApp}
              >
                <Text style={{ color: "#fff" }}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerRightButtons}>
          <TouchableOpacity 
            style={[styles.headerBtn, { backgroundColor: drawMode === DrawMode.NAVIGATE ? '#e0e0e0' : 'transparent' }]} 
            onPress={toggleNavigationMode}
          >
            <Text style={styles.headerBtnText}>🖐️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleDotGrid}>
            <Text style={styles.headerBtnText}>⊙</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleColorPalette}>
            <Text style={styles.headerBtnText}>⊕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleClear}>
            <Text style={styles.headerBtnText}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showColorPalette && (
        <View style={styles.colorPalette}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorCircle,
                { 
                  backgroundColor: color, 
                  borderColor: selectedColor === color ? "#444" : "transparent",
                  borderWidth: selectedColor === color ? 2 : 0
                }
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>
      )}

      {showPencilOptions && (
        <View style={styles.pencilOptions}>
          {STROKE_WIDTHS.map((sw) => (
            <TouchableOpacity
              key={sw}
              style={[
                styles.pencilOption,
                { 
                  borderColor: selectedStrokeWidth === sw ? "#444" : "transparent",
                  borderWidth: selectedStrokeWidth === sw ? 2 : 0
                }
              ]}
              onPress={() => setSelectedStrokeWidth(sw)}
            >
              <View
                style={{
                  width: sw,
                  height: sw,
                  backgroundColor: selectedColor,
                  borderRadius: sw / 2,
                }}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={{ minHeight: canvasHeight }}
        scrollEnabled={drawMode === DrawMode.NAVIGATE}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.canvasContainer, { height: canvasHeight }]}>
          <View style={[styles.drawingArea, { height: canvasHeight }]}>
          {pdfUri && (
  <View style={styles.pdfContainer}>
    <PdfViewer
      uri={pdfUri}
      style={styles.pdfViewer}
      onLoad={() => {
        console.log('PDF başarıyla yüklendi!');
        setPdfLoading(false);
      }}
      onError={(error) => {
        console.error('PDF yükleme hatası:', error);
        setPdfLoading(false);
        setPdfError(error);
        Alert.alert('PDF Hatası', `PDF yüklenirken bir sorun oluştu: ${error}`);
      }}
    />
    {pdfLoading && (
      <View style={styles.pdfLoadingOverlay}>
        <ActivityIndicator size="large" color="#5561fa" />
        <Text style={styles.pdfLoadingText}>PDF yükleniyor...</Text>
      </View>
    )}
  </View>
)}
            
            {showDotGrid && (
              <View style={styles.dotGridOverlay}>
                <DotGrid />
              </View>
            )}
            
            <Canvas
              ref={canvasRef}
              style={[styles.canvas, { height: canvasHeight }]}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {backgroundImage && (
                <Image
                  image={backgroundImage}
                  x={0}
                  y={0}
                  width={DRAW_AREA_SIZE}
                  height={DRAW_AREA_HEIGHT}
                  fit="contain"
                />
              )}
              
              {memoizedPaths}
              
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
        </View>
      </ScrollView>

      <View style={styles.undoRedoContainer}>
        <TouchableOpacity 
          style={[styles.undoRedoBtn, paths.length === 0 && styles.disabledBtn]} 
          onPress={handleUndo}
          disabled={paths.length === 0}
        >
          <Text style={styles.undoRedoText}>↩ Geri</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.undoRedoBtn, undoStack.length === 0 && styles.disabledBtn]} 
          onPress={handleRedo}
          disabled={undoStack.length === 0}
        >
          <Text style={styles.undoRedoText}>İleri ↪</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.toolContainer}>
          <View style={styles.tools}>
            {[1, 2, 3, 4].map((tool) => (
              <TouchableOpacity 
                key={tool} 
                style={styles.tool}
                onPress={togglePencilOptions}
              >
                <View style={[styles.pencilIcon, { height: tool * 5 + 10 }]} />
              </TouchableOpacity>
            ))}
            
            {/* Dokunmatik mod butonu */}
            <TouchableOpacity 
              style={[styles.touchModeBtn, drawMode === DrawMode.NAVIGATE && styles.touchModeBtnActive]} 
              onPress={toggleNavigationMode}
            >
              <Text style={styles.touchModeBtnText}>🖐️</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleSaveToApp}>
              <Text style={styles.actionText}>💾</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleSaveGallery}>
              <Text style={styles.actionText}>↓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Mod göstergesi */}
      {drawMode === DrawMode.NAVIGATE && (
        <View style={styles.modeIndicator}>
          <Text style={styles.modeIndicatorText}>Gezinme Modu</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#ffffff",
    zIndex: 2,
  },
  headerRightButtons: {
    flexDirection: "row",
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    borderRadius: 20,
  },
  headerBtnText: {
    fontSize: 20,
    color: "#000",
  },
  colorPalette: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
    zIndex: 3,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 6,
  },
  pencilOptions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
    zIndex: 3,
  },
  pencilOption: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
    borderRadius: 6,
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  canvasContainer: {
    width: DRAW_AREA_SIZE,
    alignSelf: 'center',
  },
  drawingArea: {
    width: DRAW_AREA_SIZE,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e5e7ec",
    marginVertical: 10,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  dotGridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  pdfContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    backgroundColor: "#f8f8f8",
  },
  pdfLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  pdfLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#5561fa",
  },
  pdfViewer: {
    width: '100%',
    height: '100%',
  },
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: '100%',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  undoRedoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 5,
    zIndex: 2,
  },
  undoRedoBtn: {
    backgroundColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  undoRedoText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  footer: {
    width: "100%",
    height: 100,
    paddingBottom: 20,
    justifyContent: "flex-end",
    backgroundColor: "#ffffff",
    zIndex: 2,
  },
  toolContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  tools: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tool: {
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pencilIcon: {
    width: 8,
    backgroundColor: '#000',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  touchModeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    backgroundColor: '#f0f0f0',
  },
  touchModeBtnActive: {
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#5561fa',
  },
  touchModeBtnText: {
    fontSize: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 10,
    marginLeft: 10,
  },
  actionText: {
    fontSize: 20,
  },
  saveDialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveDialog: {
    width: width * 0.8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  titleInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  dialogButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  modeIndicator: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
    zIndex: 5,
  },
  modeIndicatorText: {
    color: '#ffffff',
    fontWeight: 'bold',
  }
});