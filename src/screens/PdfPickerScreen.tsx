import React from "react";
import { View, TouchableOpacity, Text, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";

export default function PdfPickerScreen({ navigation }) {
  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
      
      console.log("PDF Seçim Sonucu:", result);
      
      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        const pdfUri = result.assets[0].uri;
        console.log("Seçilen PDF URI:", pdfUri);
        
        // URI kontrolü yapalım
        if (!pdfUri) {
          Alert.alert("Hata", "PDF URI'si alınamadı.");
          return;
        }
        
        // DrawingScreen'e git ve URI'yi gönder
        navigation.navigate("Drawing", { pdfUri });
      } else {
        Alert.alert("Seçim iptal edildi veya dosya alınamadı.");
      }
    } catch (error: unknown) {
      console.error("PDF seçim hatası:", error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata';
      Alert.alert("Hata", "PDF seçimi sırasında bir hata oluştu: " + errorMessage);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <TouchableOpacity onPress={pickPdf} style={{ padding: 20, backgroundColor: "#5561fa", borderRadius: 12 }}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>PDF Seç ve Üzerine Not </Text>
      </TouchableOpacity>
    </View>
  );
}