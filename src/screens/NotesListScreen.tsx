import React, { useEffect, useState } from "react";
import { View, FlatList, TouchableOpacity, Text, StyleSheet, Image } from "react-native";
import { getNotes } from "../utils/storage";
import { useIsFocused } from "@react-navigation/native";

export default function NotesListScreen({navigation}) {
  const [notes, setNotes] = useState<any[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadNotes();
    }
  }, [isFocused]);

  const loadNotes = async () => {
    try {
      const savedNotes = await getNotes();
      setNotes(savedNotes || []);
    } catch (error) {
      console.error("Notlar yüklenirken hata oluştu:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const openNote = (note) => {
    navigation.navigate("Drawing", { 
      noteId: note.id,
      isEditing: true,
      pdfUri: note.pdfUri,
      initialImageUri: note.imageUri
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notlarım</Text>
      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.noteItem}
            onPress={() => openNote(item)}
          >
            <View style={styles.noteContent}>
              <Text style={styles.noteText}>{item.title || "İsimsiz Not"}</Text>
              <Text style={styles.noteDate}>{formatDate(item.createdAt || new Date())}</Text>
            </View>
            <View style={styles.noteIndicators}>
              {item.pdfUri && <Text style={styles.pdfLabel}>PDF</Text>}
              {item.imageUri && <View style={styles.imageIndicator} />}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Kayıtlı not yok.</Text>}
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
  container: { 
    flex: 1, 
    padding: 24, 
    backgroundColor: "#f5f6fa" 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 16 
  },
  noteItem: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  noteContent: {
    flex: 1,
  },
  noteText: { 
    fontSize: 18,
  },
  noteDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  noteIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pdfLabel: { 
    color: "#5561fa", 
    fontWeight: "bold", 
    marginLeft: 8 
  },
  imageIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4cd964',
    marginLeft: 8,
  },
  emptyText: { 
    color: "#888", 
    textAlign: "center", 
    marginTop: 30 
  },
  newNoteBtn: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#5561fa",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  btnText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },
});