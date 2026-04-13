"use client";
import { useEditMode } from "../context/EditModeContext";
import { EditableText } from "./EditableText";

interface Props {
  bio: string[];
}

export default function AboutBioEditable({ bio }: Props) {
  const { editPassword } = useEditMode();

  const saveBio = async (index: number, value: string) => {
    const res = await fetch("/api/save-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: editPassword,
        type: "about",
        field: `bio.${index}`,
        value,
      }),
    });
    if (!res.ok) throw new Error("Save failed");
  };

  return (
    <div className="flex flex-col justify-start gap-5 text-[17px] leading-8 text-zinc-700">
      {bio.map((paragraph, i) => (
        <EditableText
          key={i}
          value={paragraph}
          onSave={(v) => saveBio(i, v)}
          render={(v) => (
            <p className={i === bio.length - 1 ? "font-semibold text-zinc-900" : ""}>{v}</p>
          )}
        />
      ))}
    </div>
  );
}
