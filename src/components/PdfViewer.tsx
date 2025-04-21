import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');
const DRAW_AREA_SIZE = width * 0.92;
const DRAW_AREA_HEIGHT = height * 0.5;

interface PdfViewerProps {
  uri: string;
  style?: any;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ uri, style, onLoad, onError }) => {
  const [loading, setLoading] = useState(true);

  // PDF.js viewer URL - resmi PDF.js viewer kullanıyoruz
  const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(uri)}`;

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ uri: viewerUrl }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onLoadEnd={() => {
          console.log('PDF.js viewer yüklendi');
          setLoading(false);
          if (onLoad) onLoad();
        }}
        onError={(e) => {
          console.error('WebView hatası:', e.nativeEvent);
          setLoading(false);
          if (onError) onError(e.nativeEvent.description || 'PDF görüntülenemedi');
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5561fa" />
            <Text style={styles.loadingText}>PDF yükleniyor...</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: DRAW_AREA_SIZE,
    height: DRAW_AREA_HEIGHT,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#5561fa',
  }
});

export default PdfViewer;