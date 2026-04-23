// Log Aktifitas (Audit Log) Types — sesuai response backend getAuditLogs

export interface LogData {
    log_id: number;
    action_type: string;
    table_name: string;
    record_id: number | null;
    old_value: any | null;
    new_value: any | null;
    ip_address: string | null;
    timestamp: string;
    nama_pengguna: string | null;
    role_pengguna: string | null;
    nik: string | null;
}
