import type { DaliurenDerivationStep, DaliurenHarmDepth, DaliurenNineGate, DaliurenOutput } from './types.js';
type DerivationSource = Pick<DaliurenOutput, 'dateInfo' | 'tianDiPan' | 'siKe' | 'sanChuan' | 'keTi'>;
export interface NineGateDerivation {
    method: string;
    gate: DaliurenNineGate;
    transmissions: [string, string, string];
    steps: DaliurenDerivationStep[];
    harmDepth: DaliurenHarmDepth | null;
}
export declare function deriveNineGate(source: DerivationSource): NineGateDerivation;
export {};
//# sourceMappingURL=derivation.d.ts.map