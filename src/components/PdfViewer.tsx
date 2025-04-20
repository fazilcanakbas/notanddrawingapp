import React, { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, ViewStyle, Text, ActivityIndicator, Platform } from "react-native";
import * as FileSystem from "expo-file-system";

// PDF dosyalarını görüntülemek için dinamik import kullanacağız
// Define a type for the PDF component
type PdfComponent = any;
let Pdf: PdfComponent | null = null;
try {
  // Dinamik olarak yüklemeyi deneyelim
  Pdf = require('react-native-pdf').default;
} catch (error) {
  console.log("react-native-pdf yüklenemedi:", error);
}

const { width, height } = Dimensions.get("window");
const DRAW_AREA_SIZE = width * 0.92;
const DRAW_AREA_HEIGHT = height * 0.5;

type PdfViewerProps = {
  uri: string;
  style?: ViewStyle;
};

export default function PdfViewer({ uri, style }: PdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedUri, setProcessedUri] = useState<string | null>(null);

  useEffect(() => {
    const prepareUri = async () => {
      try {
        if (!uri) {
          setError("PDF URI bulunamadı");
          setLoading(false);
          return;
        }

        console.log("Orijinal PDF URI:", uri);

        // Android'de content:// URI'lerini dosya olarak kaydetmemiz gerekiyor
        if (Platform.OS === 'android' && uri.startsWith('content://')) {
          try {
            const fileName = uri.split('/').pop() || `document-${Date.now()}.pdf`;
            const destination = `${FileSystem.documentDirectory}${fileName}`;
            
            await FileSystem.copyAsync({
              from: uri,
              to: destination
            });
            
            console.log("Dosya kopyalandı:", destination);
            setProcessedUri(destination);
          } catch (e) {
            console.error("Dosya kopyalama hatası:", e);
            // Hata durumunda orijinal URI'yi kullanmayı deneyelim
            setProcessedUri(uri);
          }
        } else {
          setProcessedUri(uri);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("PDF hazırlama hatası:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`PDF hazırlanamadı: ${errorMessage}`);
        setLoading(false);
      }
    };

    prepareUri();
  }, [uri]);

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color="#5561fa" />
        <Text style={styles.loadingText}>PDF hazırlanıyor...</Text>
      </View>
    );
  }

  if (error || !processedUri) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>{error || "PDF yüklenemedi"}</Text>
        <Text style={styles.uriText}>URI: {uri}</Text>
      </View>
    );
  }

  // react-native-pdf yüklenemediyse basit görünümü göster
  if (!Pdf) {
    const pdfName = processedUri.split('/').pop() || "PDF Dosyası";
    return (
      <View style={[styles.container, style]}>
        <View style={styles.pdfPreview}>
          <Text style={styles.pdfTitle}>{pdfName}</Text>
          <Text style={styles.infoText}>PDF içeriği (sadece çizim alanı görünüyor)</Text>
          <View style={styles.pdfPage}></View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Pdf
        source={{ uri: processedUri }}
        onLoadComplete={(numberOfPages: any, filePath: any) => {
          console.log(`PDF loaded: ${numberOfPages} pages`);
        }}
        onError={(error) => {
          console.log("PDF error:", error);
          setError(`PDF görüntüleme hatası: ${error}`);
        }}
        style={styles.pdf}
        enablePaging={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: DRAW_AREA_SIZE,
    height: DRAW_AREA_HEIGHT,
    backgroundColor: "#fff",
    position: "absolute",
    zIndex: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#5561fa',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 10,
  },
  uriText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    margin: 5,
  },
  pdfPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  pdfTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  pdfPage: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  }
});