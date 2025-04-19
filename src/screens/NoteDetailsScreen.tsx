// import React, { useEffect, useState } from "react";
// import DrawingPad from "../components/DrawingPad";
// import { getNote } from "../../utils/storage";
// import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";

// type RootStackParamList = {
//   NoteDetail: { noteId: string };
// };

// export default function NoteDetailScreen() {
//   const route = useRoute<RouteProp<RootStackParamList, "NoteDetail">>();
//   const navigation = useNavigation();
//   const [note, setNote] = useState<any>(null);

//   useEffect(() => {
//     getNote(route.params.noteId).then(setNote);
//   }, [route.params.noteId]);

//   if (!note) return null;

//   return (
//     <DrawingPad
//       noteId={note.id}
//       pdfUri={note.pdfUri}
//       initialImageUri={note.imageUri}
//       navigation={navigation}
//       isEditing
//     />
//   );
// }