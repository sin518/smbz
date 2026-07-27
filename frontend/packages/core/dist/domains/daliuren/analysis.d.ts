import type { DaliurenAnalysisBasis, DaliurenOutput } from './types.js';
type AnalysisSource = Pick<DaliurenOutput, 'dateInfo' | 'tianDiPan' | 'siKe' | 'sanChuan' | 'keTi' | 'gongInfos'>;
export declare function buildDaliurenAnalysisBasis(source: AnalysisSource): DaliurenAnalysisBasis;
export {};
//# sourceMappingURL=analysis.d.ts.map