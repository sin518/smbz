import { cn } from "@/lib/utils";

export type DivinationModuleKey = "bazi" | "liuyao" | "ziwei" | "qimen" | "daliuren";

const moduleCharacters: Record<DivinationModuleKey, readonly [string, string]> = {
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
    <span
      className={cn(
        "relative flex select-none flex-col items-center justify-center font-semibold leading-[0.88] [font-family:'HanziPen_SC','STKaiti','Kaiti_SC','Songti_SC',serif]",
        size === "home" ? "h-10 w-10 gap-px text-[17px]" : "h-7 w-7 text-[10px]"
      )}
      aria-hidden="true"
    >
      <span>{characters[0]}</span>
      <span>{characters[1]}</span>
      <span
        className={cn(
          "absolute rounded-[1px] bg-current opacity-90",
          size === "home" ? "bottom-[3px] right-[3px] h-[5px] w-[5px]" : "bottom-[2px] right-[2px] h-[3px] w-[3px]"
        )}
      />
    </span>
  );
}
