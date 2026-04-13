"use client";
import { useEditMode } from "../context/EditModeContext";
import { EditableText } from "./EditableText";

interface Fact {
  emoji: string;
  label: string;
  value: string;
  note: string;
}

interface Props {
  facts: Fact[];
}

export default function AboutFactsEditable({ facts }: Props) {
  const { editPassword } = useEditMode();

  const saveFact = async (index: number, field: "value" | "note", val: string) => {
    const res = await fetch("/api/save-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: editPassword,
        type: "about",
        field: `facts.${index}.${field}`,
        value: val,
      }),
    });
    if (!res.ok) throw new Error("Save failed");
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {facts.map((fact, i) => (
        <div
          key={fact.label}
          className="border border-zinc-200 rounded-sm p-5 hover:border-[#C1440E] transition-colors group"
        >
          <div className="text-3xl mb-3">{fact.emoji}</div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
            {fact.label}
          </p>
          <EditableText
            value={fact.value}
            onSave={(v) => saveFact(i, "value", v)}
            render={(v) => <p className="text-lg font-black text-zinc-900 mb-1">{v}</p>}
          />
          <EditableText
            value={fact.note}
            onSave={(v) => saveFact(i, "note", v)}
            render={(v) => <p className="text-sm text-zinc-500 italic">{v}</p>}
          />
        </div>
      ))}
    </div>
  );
}
