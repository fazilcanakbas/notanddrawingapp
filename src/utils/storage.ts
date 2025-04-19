import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { v4 as uuidv4 } from "uuid";

export async function saveNote({ imageUri, pdfUri }: { imageUri: string; pdfUri?: string }) {
  const id = uuidv4();
  const notes = JSON.parse((await AsyncStorage.getItem("notes")) || "[]");
  const newNote = {
    id,
    title: `Not ${notes.length + 1}`,
    imageUri,
    pdfUri,
    createdAt: Date.now(),
  };
  await AsyncStorage.setItem("notes", JSON.stringify([newNote, ...notes]));
}

export async function updateNote(id: string, { imageUri, pdfUri }: { imageUri: string; pdfUri?: string }) {
  const notes = JSON.parse((await AsyncStorage.getItem("notes")) || "[]");
  const idx = notes.findIndex((n: any) => n.id === id);
  if (idx === -1) return;
  notes[idx] = { ...notes[idx], imageUri, pdfUri, updatedAt: Date.now() };
  await AsyncStorage.setItem("notes", JSON.stringify(notes));
}

export async function getNotes() {
  return JSON.parse((await AsyncStorage.getItem("notes")) || "[]");
}

export async function getNote(id: string) {
  const notes = JSON.parse((await AsyncStorage.getItem("notes")) || "[]");
  return notes.find((n: any) => n.id === id);
}