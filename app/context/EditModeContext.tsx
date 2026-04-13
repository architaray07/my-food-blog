"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface EditModeContextType {
  isEditMode: boolean;
  editPassword: string;
  enterEditMode: (password: string) => void;
  exitEditMode: () => void;
}

const EditModeContext = createContext<EditModeContextType>({
  isEditMode: false,
  editPassword: "",
  enterEditMode: () => {},
  exitEditMode: () => {},
});

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPassword, setEditPassword] = useState("");

  // Restore edit mode from session on page load
  useEffect(() => {
    const mode = sessionStorage.getItem("alist_edit_mode");
    const pw = sessionStorage.getItem("alist_edit_pw");
    if (mode === "true" && pw) {
      setIsEditMode(true);
      setEditPassword(pw);
    }
  }, []);

  const enterEditMode = (password: string) => {
    setIsEditMode(true);
    setEditPassword(password);
    sessionStorage.setItem("alist_edit_mode", "true");
    sessionStorage.setItem("alist_edit_pw", password);
  };

  const exitEditMode = () => {
    setIsEditMode(false);
    setEditPassword("");
    sessionStorage.removeItem("alist_edit_mode");
    sessionStorage.removeItem("alist_edit_pw");
  };

  return (
    <EditModeContext.Provider value={{ isEditMode, editPassword, enterEditMode, exitEditMode }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  return useContext(EditModeContext);
}
