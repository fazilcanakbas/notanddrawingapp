import React, { useEffect, useState } from "react";
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from "react-native";
import { getNotes } from "../utils/storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NavigationProp, ParamListBase } from "@react-navigation/native";

export default function NotesListScreen({navigation}) {
  const [notes, setNotes] = useState<any[]>([]);
  // const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const isFocused = useIsFocused();

  useEffect(() => {
    getNotes().then(setNotes);
  }, [isFocused]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notlarım</Text>
      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.noteItem}
            // onPress={() => navigation.navigate("NoteDetail", { noteId: item.id })}
          >
            <Text style={styles.noteText}>{item.title}</Text>
            {item.pdfUri && <Text style={styles.pdfLabel}>PDF</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: "#888", textAlign: "center", marginTop: 30 }}>Kayıtlı not yok.</Text>}
      />
      <TouchableOpacity
        style={styles.newNoteBtn}
        onPress={() => navigation.navigate("Drawing")}
      >
        <Text style={styles.btnText}>Yeni Not</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.newNoteBtn, { backgroundColor: "#68b" }]}
        onPress={() => navigation.navigate("PdfPicker")}
      >
        <Text style={styles.btnText}>PDF Üzerine Not</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#f5f6fa" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  noteItem: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  noteText: { fontSize: 18, flex: 1 },
  pdfLabel: { color: "#5561fa", fontWeight: "bold", marginLeft: 8 },
  newNoteBtn: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#5561fa",
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
});