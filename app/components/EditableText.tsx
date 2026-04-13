"use client";
import { useState, ReactNode } from "react";
import { useEditMode } from "../context/EditModeContext";

interface Props {
  value: string;
  onSave: (value: string) => Promise<void>;
  /** Render prop — receives current value, returns display JSX */
  render: (value: string) => ReactNode;
  /** Use textarea instead of input */
  multiline?: boolean;
  /** Extra className applied to the editing textarea/input */
  editClassName?: string;
}

export function EditableText({
  value,
  onSave,
  render,
  multiline = false,
  editClassName,
}: Props) {
  const { isEditMode } = useEditMode();
  const [currentValue, setCurrentValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const startEditing = () => {
    setDraft(currentValue);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsEditing(false);
    if (draft === currentValue) return;
    setSaveStatus("saving");
    try {
      await onSave(draft);
      setCurrentValue(draft);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setDraft(currentValue);
      setIsEditing(false);
      return;
    }
    // Single-line: Enter saves
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      handleSave();
      return;
    }
    // Multiline: Cmd/Ctrl+Enter saves
    if (multiline && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSave();
      return;
    }
  };

  // Visitor mode — plain render
  if (!isEditMode) return <>{render(currentValue)}</>;

  // Actively editing — show input/textarea
  if (isEditing) {
    const base =
      "w-full border-2 border-[#C1440E] rounded-sm bg-amber-50/20 outline-none font-[inherit]";
    return multiline ? (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        rows={10}
        className={`${base} p-3 resize-y text-[17px] leading-8 text-zinc-700 ${editClassName ?? ""}`}
      />
    ) : (
      <input
        autoFocus
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`${base} px-2 py-1 ${editClassName ?? ""}`}
      />
    );
  }

  // Edit mode, not yet editing — show with dashed ring + click to edit
  return (
    <div
      onClick={startEditing}
      className="relative cursor-text group/editable"
      title={multiline ? "Click to edit (Cmd+Enter to save)" : "Click to edit"}
    >
      <div className="ring-1 ring-dashed ring-[#C1440E]/30 rounded transition-all group-hover/editable:ring-[#C1440E]/70 group-hover/editable:bg-amber-50/20">
        {render(currentValue)}
      </div>
      {saveStatus === "saved" && (
        <span className="absolute -top-2 right-0 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
          Saved
        </span>
      )}
      {saveStatus === "saving" && (
        <span className="absolute -top-2 right-0 text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
          Saving…
        </span>
      )}
      {saveStatus === "error" && (
        <span className="absolute -top-2 right-0 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
          Error
        </span>
      )}
    </div>
  );
}
