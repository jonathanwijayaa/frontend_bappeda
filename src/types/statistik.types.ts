export interface ChartData {
  [key: string]: number | string;
  name: string;
  value: number;
}

export interface StatistikState {
  error: string | null;
  gender: ChartData[];
  kaderPerOpd: ChartData[];
  kelurahan: ChartData[];
  loading: boolean;
  relawanPerKader: ChartData[];
}
