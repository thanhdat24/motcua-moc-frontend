import { FetchResult } from '../types';

// Helper: demo data generator
const getRandomCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchAllDossiers = async (
  _token?: string,   // Giữ tham số để tương thích signature App.tsx, nhưng không dùng (do dùng cookie)
  _baseUrl?: string, // Giữ tham số để tương thích
  useMock: boolean = false
): Promise<FetchResult & { unauthorized?: boolean; networkError?: boolean; needToken?: boolean }> => {
  
  // 1. DEMO MODE (Giả lập dữ liệu)
  if (useMock) {
    await sleep(600 + Math.random() * 800);

    const makeFakeItem = (prefix: string, i: number): any => ({
      id: `${prefix}-${i + 1}`,
      soHoSo: `${prefix}-${1000 + i}`,
      trichYeu: `Hồ sơ demo ${prefix} #${i + 1}`,
      trangThai: ['Mới', 'Đang xử lý', 'Hoàn thành'][i % 3],
    });

    const datCount = getRandomCount(5, 25);
    const sauCount = getRandomCount(5, 25);

    return {
      dat: Array.from({ length: datCount }, (_, i) => makeFakeItem('DAT', i)),
      sau: Array.from({ length: sauCount }, (_, i) => makeFakeItem('SAU', i)),
    };
  }

  // 2. REAL API (Logic thực tế từ bạn)
  try {
    const res = await fetch("/api/dossiers", {
      method: "GET",
      credentials: "include",
    });

    if (res.status === 401) {
      const j = await res.json().catch(() => ({}));
      return { 
        dat: [], 
        sau: [], 
        error: "Cần nhập token hoặc token đã hết hạn.", 
        unauthorized: true,
        needToken: true, // Flag bổ trợ cho App.tsx bật modal
        ...(j || {}) 
      };
    }

    if (!res.ok) {
      return { dat: [], sau: [], error: "Lỗi kết nối backend.", networkError: true };
    }

    const data = await res.json();
    return {
      dat: Array.isArray(data?.dat) ? data.dat : [],
      sau: Array.isArray(data?.sau) ? data.sau : [],
    };
  } catch {
    return { dat: [], sau: [], error: "Lỗi mạng.", networkError: true };
  }
};