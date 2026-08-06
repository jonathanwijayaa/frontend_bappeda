// Log Aktifitas (Audit Log) Types — sesuai response backend getAuditLogs

export interface LogData {
  action_type: string;
  ip_address: string | null;
  log_id: number;
  nama_pengguna: string | null;
  new_value: unknown | null;
  nik: string | null;
  old_value: unknown | null;
  record_id: number | null;
  role_pengguna: string | null;
  table_name: string;
  timestamp: string;
}
