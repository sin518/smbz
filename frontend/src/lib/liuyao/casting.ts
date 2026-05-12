export type LiuyaoLineKind = "old-yin" | "young-yang" | "young-yin" | "old-yang";

export type LiuyaoLine = {
  position: number;
  coins: [0 | 1, 0 | 1, 0 | 1];
  total: 6 | 7 | 8 | 9;
  kind: LiuyaoLineKind;
  changing: boolean;
};

const lineKindByTotal: Record<LiuyaoLine["total"], LiuyaoLineKind> = {
  6: "old-yin",
  7: "young-yang",
  8: "young-yin",
  9: "old-yang"
};

export function castLiuyaoLine(position: number, random = Math.random): LiuyaoLine {
  const coins = Array.from({ length: 3 }, () => (random() >= 0.5 ? 1 : 0)) as [0 | 1, 0 | 1, 0 | 1];
  const total = coins.reduce<number>((sum, coin) => sum + (coin === 1 ? 3 : 2), 0) as LiuyaoLine["total"];
  const kind = lineKindByTotal[total];

  return {
    position,
    coins,
    total,
    kind,
    changing: total === 6 || total === 9
  };
}
