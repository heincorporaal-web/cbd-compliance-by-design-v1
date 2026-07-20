import React, { useMemo } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

// Open-source TrueType fonts, loaded via Google Fonts in index.css.
export const OPEN_SOURCE_FONTS = [
  "nunito",
  "roboto",
  "open-sans",
  "lato",
  "montserrat",
  "merriweather",
  "source-sans-pro",
  "source-code-pro",
];

// Register the font whitelist once (module load).
const FontAttributor = Quill.import("formats/font");
FontAttributor.whitelist = OPEN_SOURCE_FONTS;
Quill.register(FontAttributor, true);

const MODULES = {
  toolbar: {
    container: [
      [{ font: OPEN_SOURCE_FONTS }, { size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
    ],
  },
};

export default function ActivityDescriptionEditor({ value, onChange }) {
  const modules = useMemo(() => MODULES, []);
  return (
    <div className="activity-description-editor">
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        placeholder="Describe this activity…"
      />
    </div>
  );
}