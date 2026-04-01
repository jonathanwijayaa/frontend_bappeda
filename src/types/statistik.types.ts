export interface ChartData {
    name: string;
    value: number;
}

export interface StatistikState {
    gender: ChartData[];
    kelurahan: ChartData[];
    relawanPerKader: ChartData[];
    kaderPerOpd: ChartData[];
    loading: boolean;
    error: string | null;
}