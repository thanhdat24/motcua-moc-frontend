import { FetchResult, MinistryData } from "../types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createEmptyMinistry = (): MinistryData => ({ dangXuLy: [], gap: [] });

const normalizeBearer = (t: string) => {
  const v = (t || "").trim();
  if (!v) return "";
  return v.toLowerCase().startsWith("bearer ") ? v : `Bearer ${v}`;
};

export const fetchAllDossiers = async (
  _token?: string,
  _baseUrl?: string,
  useMock: boolean = false
): Promise<FetchResult & { needToken?: boolean }> => {
  if (useMock) {
    await sleep(800);
    const makeItem = (prefix: string, i: number) => ({
      id: `${prefix}-${i}`,
      code: `${prefix}-${2024000 + i}`,
      applicant: {
        data: {
          noidungyeucaugiaiquyet: `Nội dung hồ sơ ${prefix} mẫu số ${i}`,
        },
      },
      accepter: { fullname: "Cán bộ thụ lý mẫu" },
      appointmentDate: new Date(
        Date.now() + (i % 2 === 0 ? 3600000 : 86400000 * 5)
      ).toISOString(),
    });

    return {
      boXayDung: {
        dangXuLy: Array.from({ length: 5 }, (_, i) =>
          makeItem("BXD-NORMAL", i)
        ),
        gap: Array.from({ length: 2 }, (_, i) => makeItem("BXD-URGENT", i)),
      },
      boYTe: {
        dangXuLy: Array.from({ length: 3 }, (_, i) =>
          makeItem("BYT-NORMAL", i)
        ),
        gap: Array.from({ length: 1 }, (_, i) => makeItem("BYT-URGENT", i)),
      },
    };
  }

  try {
    // ✅ LẤY TOKEN TỪ LOCAL STORAGE
    const tokenBXD = normalizeBearer(localStorage.getItem("TOKEN_BXD") || "");
    const tokenBYT = normalizeBearer(localStorage.getItem("TOKEN_BYT") || "");

    // Nếu thiếu token -> báo cần token (để mở modal)
    if (!tokenBXD || !tokenBYT) {
      return {
        boXayDung: createEmptyMinistry(),
        boYTe: createEmptyMinistry(),
        error: "Cần nhập token BXD và BYT.",
        unauthorized: true,
        needToken: true,
      };
    }

    const res = await fetch("/api/dossiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // ✅ cần thiết
      credentials: "include",
      body: JSON.stringify({ tokenBXD, tokenBYT }), // ✅ gửi lên backend
    });

    if (res.status === 401) {
      // backend sẽ trả needToken/unauthorized khi token hết hạn
      const j = await res.json().catch(() => ({}));
      return {
        boXayDung: createEmptyMinistry(),
        boYTe: createEmptyMinistry(),
        error: j?.error || "Cần nhập token hoặc token đã hết hạn.",
        unauthorized: true,
        needToken: true,
      };
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        boXayDung: createEmptyMinistry(),
        boYTe: createEmptyMinistry(),
        error: data?.error || "Lỗi kết nối backend.",
        networkError: true,
      };
    }

    return {
      boXayDung: data?.boXayDung || createEmptyMinistry(),
      boYTe: data?.boYTe || createEmptyMinistry(),
    };
  } catch {
    return {
      boXayDung: createEmptyMinistry(),
      boYTe: createEmptyMinistry(),
      error: "Lỗi mạng.",
      networkError: true,
    };
  }
};
