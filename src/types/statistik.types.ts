export interface ChartData {
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
