declare module "lunar-javascript" {
  export class Solar {
    static fromYmdHms(year: number, month: number, day: number, hour?: number, minute?: number, second?: number): Solar;
    getLunar(): Lunar;
  }

  export class Lunar {
    getYearInChinese(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getTimeInGanZhi(): string;
  }
}
