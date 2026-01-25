export interface UploadResponse {
  success: boolean;
  message: string;
}

export enum InputMethod {
  TEXT = 'TEXT',
  FILE = 'FILE'
}

/**
 * Cấu trúc hồ sơ DVC (thực tế có thể thiếu field)
 * => để optional để UI không crash khi render
 */
export interface DossierItem {
  id?: string;
  code?: string;

  applicant?: {
    data?: {
      noidungyeucaugiaiquyet?: string;
      // có thể có các field khác
      [key: string]: any;
    };
    [key: string]: any;
  };

  accepter?: {
    fullname?: string;
    [key: string]: any;
  };

  appointmentDate?: string;

  procedure?: {
    id?: string;
    [key: string]: any;
  };

  currentTask?: any;

  // giữ cửa cho field phát sinh
  [key: string]: any;
}

/**
 * Kết quả fetch từ backend
 * - dat/sau: danh sách hồ sơ
 * - error: message hiển thị
 * - unauthorized: để App bật cảnh báo 401
 * - networkError: để App bật cảnh báo lỗi mạng
 */
export interface FetchResult {
  dat: DossierItem[];
  sau: DossierItem[];
  error?: string;
  unauthorized?: boolean;
  networkError?: boolean;
}
