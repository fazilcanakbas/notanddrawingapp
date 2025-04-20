import React from "react";
import { View, TouchableOpacity, Text, Alert, StyleSheet } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";

export default function PdfPickerScreen() {
  const navigation = useNavigation();

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        Alert.alert("PDF Seçimi", "Seçim iptal edildi.");
        return;
      }

      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        console.log("PDF seçildi:", result.assets[0].uri);
        navigation.navigate("Drawing", { pdfUri: result.assets[0].uri });
      } else {
        Alert.alert("Hata", "Dosya alınamadı veya dosya geçerli bir PDF değil.");
      }
    } catch (error) {
      console.error("PDF seçiminde hata:", error);
      Alert.alert("Hata", "PDF seçilirken bir hata oluştu.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickPdf} style={styles.button}>
        <Text style={styles.buttonText}>PDF Seç ve Üzerine Not Al</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
  },
  button: {
    padding: 20,
    backgroundColor: "#5561fa",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});