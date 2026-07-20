import { cn } from "@/lib/utils";
import { divinationGlyphPaths, type DivinationGlyph } from "@/components/shared/divination-module-glyph-paths";

export type DivinationModuleKey = "bazi" | "liuyao" | "ziwei" | "qimen" | "daliuren";

const moduleCharacters: Record<DivinationModuleKey, readonly [DivinationGlyph, DivinationGlyph]> = {
  bazi: ["八", "字"],
  liuyao: ["六", "爻"],
  ziwei: ["紫", "微"],
  qimen: ["奇", "门"],
  daliuren: ["六", "壬"]
};

export function DivinationModuleMark({
  moduleKey,
  size = "home"
}: {
  moduleKey: DivinationModuleKey;
  size?: "home" | "header";
}) {
  const characters = moduleCharacters[moduleKey];

  return (
    <svg
      viewBox="0 0 1000 2000"
      className={cn(
        "select-none fill-current",
        size === "home" ? "h-10 w-5" : "h-6 w-3"
      )}
      aria-hidden="true"
      focusable="false"
    >
      <g transform="translate(0 880) scale(1 -1)">
        <path d={divinationGlyphPaths[characters[0]]} />
      </g>
      <g transform="translate(0 1880) scale(1 -1)">
        <path d={divinationGlyphPaths[characters[1]]} />
      </g>
      <rect x="790" y="1810" width="150" height="150" rx="22" opacity="0.9" />
    </svg>
  );
}
