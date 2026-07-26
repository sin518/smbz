import type { DaliurenAnalysisBasis, DaliurenOutput, DaliurenTimingMethod } from './types.js';
type AnalysisSource = Pick<DaliurenOutput, 'dateInfo' | 'tianDiPan' | 'siKe' | 'sanChuan' | 'keTi' | 'gongInfos'>;
export declare function buildDaliurenAnalysisBasis(source: AnalysisSource, timingMethod?: DaliurenTimingMethod): DaliurenAnalysisBasis;
export {};
//# sourceMappingURL=analysis.d.ts.map