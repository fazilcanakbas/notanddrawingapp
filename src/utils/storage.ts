import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { v4 as uuidv4 } from "uuid";





const NOTES_STORAGE_KEY = 'notes_app_data';

export type Note = {
  id: string;
  title: string;
  imageUri?: string;
  pdfUri?: string;
  createdAt: string;
  updatedAt?: string;
  paths?: Array<{
    svgPath: string;
    color: string;
    strokeWidth: number;
  }>;
};

// Not Kaydetme Fonksiyonu
export const saveNote = async (note: Omit<Note, 'id'> & { id?: string }) => {
  try {
    // Mevcut notları al
    const existingNotes = await getNotes();
    
    // Yeni not için ID yoksa oluştur
    const newNote = {
      ...note,
      id: note.id || Date.now().toString() + Math.floor(Math.random() * 10000).toString()
    };
    
    // Not zaten varsa güncelle, yoksa yeni ekle
    const updatedNotes = existingNotes.some(n => n.id === newNote.id)
      ? existingNotes.map(n => n.id === newNote.id ? newNote : n)
      : [newNote, ...existingNotes];
    
    // Notları kaydet
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
    return newNote;
  } catch (error) {
    console.error('Not kaydedilirken hata oluştu:', error);
    throw error;
  }
};

// Notları Alma Fonksiyonu
export const getNotes = async (): Promise<Note[]> => {
  try {
    const notes = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
    return notes ? JSON.parse(notes) : [];
  } catch (error) {
    console.error('Notlar alınırken hata oluştu:', error);
    return [];
  }
};

// Notu ID'ye göre alma
export const getNote = async (noteId: string): Promise<Note | null> => {
  try {
    const notes = await getNotes();
    return notes.find(note => note.id === noteId) || null;
  } catch (error) {
    console.error('Not alınırken hata oluştu:', error);
    return null;
  }
};

// Notu ID'ye göre güncelleme
export const updateNote = async (noteId: string, updates: Partial<Note>): Promise<Note | null> => {
  try {
    const notes = await getNotes();
    const noteIndex = notes.findIndex(note => note.id === noteId);
    
    if (noteIndex === -1) return null;
    
    const updatedNote = { ...notes[noteIndex], ...updates };
    notes[noteIndex] = updatedNote;
    
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    return updatedNote;
  } catch (error) {
    console.error('Not güncellenirken hata oluştu:', error);
    return null;
  }
};

// Notu ID'ye göre silme
export const deleteNote = async (noteId: string): Promise<boolean> => {
  try {
    const notes = await getNotes();
    const filteredNotes = notes.filter(note => note.id !== noteId);
    
    if (filteredNotes.length === notes.length) return false; // Not bulunamadı
    
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(filteredNotes));
    return true;
  } catch (error) {
    console.error('Not silinirken hata oluştu:', error);
    return false;
  }
};