import React, { useEffect, useMemo, useState } from "react";
import DossierTable from "./components/DossierTable";
import LoginModal from "./components/LoginModal";
import TokenModal from "./components/TokenModal";
import { fetchAllDossiers } from "./services/api";
import { MinistryData } from "./types";
import { ICONS } from "./constants";
import {
  Settings,
  RefreshCw,
  LayoutDashboard,
  Building2,
  Stethoscope,
  Zap,
  ChevronRight,
  Globe,
  Lock,
} from "lucide-react";

type FetchResult = {
  boXayDung?: MinistryData;
  boYTe?: MinistryData;

  // giữ logic cũ
  unauthorized?: boolean; // 401
  needToken?: boolean; // token hết hạn/invalid
  networkError?: boolean;
  error?: string;
};

const App: React.FC = () => {
  // Demo mode
  const [useMock, setUseMock] = useState<boolean>(
    () => localStorage.getItem("USE_MOCK") === "true"
  );
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Theme
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("THEME");
    return saved ? saved === "dark" : false;
  });

  // Tabs
  const [activeTab, setActiveTab] = useState<"BXD" | "BYT">("BXD");

  // Auth & Token modals (giữ theo logic cũ)
  const [showLogin, setShowLogin] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [tokenSaving, setTokenSaving] = useState(false);
  const [targetMinistry, setTargetMinistry] = useState<"BXD" | "BYT" | null>(
    null
  );
  const LS_TOKEN_BXD = "TOKEN_BXD";
  const LS_TOKEN_BYT = "TOKEN_BYT";

  // Data
  const [loading, setLoading] = useState(false);
  const [boXayDung, setBoXayDung] = useState<MinistryData>({
    dangXuLy: [],
    gap: [],
  });
  const [boYTe, setBoYTe] = useState<MinistryData>({
    dangXuLy: [],
    gap: [],
  });
  const [hasFetched, setHasFetched] = useState(false);

  // Status flags (giữ theo logic cũ)
  const [unauthorized, setUnauthorized] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Apply Theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("THEME", darkMode ? "dark" : "light");
  }, [darkMode]);

  // -------- Helpers: auth/token checks (GIỮ CŨ) --------
  const checkLoggedIn = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      return res.ok;
    } catch {
      return false;
    }
  };

  const checkHasToken = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/token", { credentials: "include" });
      if (!res.ok) return false;
      const j = await res.json().catch(() => ({}));
      return !!j?.hasToken;
    } catch {
      return false;
    }
  };

  // -------- Fetch data (GIỮ CŨ VỀ XỬ LÝ TRẠNG THÁI) --------
  const handleRefresh = async (currentMock: boolean = useMock) => {
    setLoading(true);
    setErrorMsg("");
    setUnauthorized(false);
    setNetworkError(false);

    // clear old data when loading
    setBoXayDung({ dangXuLy: [], gap: [] });
    setBoYTe({ dangXuLy: [], gap: [] });
    setHasFetched(false);

    const result: FetchResult = await fetchAllDossiers(
      undefined,
      undefined,
      currentMock
    );

    // token hết hạn/invalid hoặc unauthorized => mở token modal
    if (result?.needToken || result?.unauthorized) {
      setUnauthorized(true);
      setTargetMinistry(activeTab);
      // setShowTokenModal(true);
      setLoading(false);
      return;
    }

    if (result?.networkError) {
      setNetworkError(true);
    }

    if (result?.error) {
      setErrorMsg(result.error);
    } else {
      // mapping data theo code mới
      setBoXayDung(result.boXayDung || { dangXuLy: [], gap: [] });
      setBoYTe(result.boYTe || { dangXuLy: [], gap: [] });
    }

    setHasFetched(true);
    setLoading(false);
  };

  // -------- Initial load (GIỮ CŨ) --------
  useEffect(() => {
    (async () => {
      // Demo mode: không cần login/token
      if (useMock) {
        await handleRefresh(true);
        return;
      }

      const isLogged = await checkLoggedIn();
      if (!isLogged) {
        setShowLogin(true);
        return;
      }

      const hasToken = await checkHasToken();
      if (!hasToken) {
        setTargetMinistry("BXD");
        setShowTokenModal(true);
        return;
      }

      await handleRefresh(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- Login / Save token / Logout (GIỮ CŨ) --------
  const onLogin = async (username: string, password: string) => {
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setLoginError("Sai tài khoản hoặc mật khẩu.");
        setLoginLoading(false);
        return;
      }

      setShowLogin(false);
      setLoginLoading(false);

      // Sau login: check token
      const hasToken = await checkHasToken();
      if (!hasToken) {
        setTargetMinistry("BXD");
        setShowTokenModal(true);
      } else {
        await handleRefresh(false);
      }
    } catch {
      setLoginError("Lỗi mạng khi đăng nhập.");
      setLoginLoading(false);
    }
  };

  // const onSaveToken = async (token: string) => {
  //   setTokenSaving(true);
  //   setTokenError("");

  //   try {
  //     const res = await fetch("/api/token", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       credentials: "include",
  //       body: JSON.stringify({ token }),
  //     });

  //     if (!res.ok) {
  //       setTokenError("Không lưu được token. Kiểm tra lại.");
  //       setTokenSaving(false);
  //       return;
  //     }

  //     setShowTokenModal(false);
  //     setTokenSaving(false);

  //     await handleRefresh(false);
  //   } catch {
  //     setTokenError("Lỗi mạng khi lưu token.");
  //     setTokenSaving(false);
  //   }
  // };

  const onSaveToken = async (token: string) => {
    setTokenSaving(true);
    setTokenError("");

    try {
      const normalize = (t: string) => {
        const v = (t || "").trim();
        if (!v) return "";
        return v.toLowerCase().startsWith("bearer ") ? v : `Bearer ${v}`;
      };

      const cleaned = normalize(token);
      if (!cleaned) {
        setTokenError("Token không hợp lệ.");
        setTokenSaving(false);
        return;
      }

      const key =
        (targetMinistry || "BXD") === "BXD" ? "TOKEN_BXD" : "TOKEN_BYT";
      localStorage.setItem(key, cleaned);

      setShowTokenModal(false);
      await handleRefresh(false);
    } catch {
      setTokenError("Lỗi khi lưu token.");
    } finally {
      setTokenSaving(false);
    }
  };

  const onLogout = async () => {
    try {
      await fetch("/api/auth/logout", { credentials: "include" });
    } catch {}

    setBoXayDung({ dangXuLy: [], gap: [] });
    setBoYTe({ dangXuLy: [], gap: [] });
    setHasFetched(false);
    setUnauthorized(false);
    setNetworkError(false);
    setErrorMsg("");
    setShowSettings(false);
    setShowTokenModal(false);
    setShowLogin(true);
  };

  // -------- Derived totals (UI mới) --------
  const totalGapBXD = useMemo(
    () => boXayDung.gap.length,
    [boXayDung.gap.length]
  );
  const totalGapBYT = useMemo(() => boYTe.gap.length, [boYTe.gap.length]);
  const totalGap = useMemo(
    () => totalGapBXD + totalGapBYT,
    [totalGapBXD, totalGapBYT]
  );

  const totalBXD = useMemo(
    () => boXayDung.dangXuLy.length + boXayDung.gap.length,
    [boXayDung.dangXuLy.length, boXayDung.gap.length]
  );
  const totalBYT = useMemo(
    () => boYTe.dangXuLy.length + boYTe.gap.length,
    [boYTe.dangXuLy.length, boYTe.gap.length]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <LayoutDashboard size={20} />
            </div>
            <div className="flex flex-col leading-tight">
              <h1 className="font-bold text-lg hidden sm:block">
                Hệ Thống Liên Bộ
              </h1>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                {useMock ? (
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                    DEMO MODE
                  </span>
                ) : showLogin ? (
                  <span className="font-semibold text-orange-500 flex items-center gap-1">
                    <Lock size={12} /> Chưa đăng nhập
                  </span>
                ) : showTokenModal ? (
                  <span className="font-semibold text-orange-500">
                    Cần Token
                  </span>
                ) : unauthorized ? (
                  <span className="font-semibold text-red-500">
                    401 Unauthorized
                  </span>
                ) : networkError ? (
                  <span className="font-semibold text-orange-500 flex items-center gap-1">
                    <Globe size={12} /> Lỗi kết nối
                  </span>
                ) : errorMsg ? (
                  <span className="font-semibold text-orange-500">
                    Lỗi dữ liệu
                  </span>
                ) : loading ? (
                  <span className="font-semibold text-blue-500">
                    Đang tải...
                  </span>
                ) : (
                  <span className="font-semibold text-green-600">Sẵn sàng</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title={
                darkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"
              }
            >
              {darkMode ? <ICONS.Sun size={20} /> : <ICONS.Moon size={20} />}
            </button>

            <button
              onClick={() => handleRefresh()}
              disabled={loading || (!useMock && (showLogin || showTokenModal))}
              className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors ${
                loading ? "animate-spin text-blue-500" : ""
              }`}
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={20} />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Cài đặt"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Alerts (giữ logic cũ, UI tối giản theo layout mới) */}
        {unauthorized && !useMock && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl p-4">
            <div className="text-sm font-semibold text-red-700 dark:text-red-200">
              Token hết hạn / không hợp lệ. Vui lòng nhập token mới.
            </div>
            <button
              onClick={() => setShowTokenModal(true)}
              className="mt-2 text-sm font-bold text-red-600 dark:text-red-300 underline"
            >
              Nhập token ngay
            </button>
          </div>
        )}

        {networkError && !useMock && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/40 rounded-xl p-4">
            <div className="text-sm font-semibold text-orange-800 dark:text-orange-200">
              Không thể kết nối tới Backend. Kiểm tra mạng hoặc upstream đang
              chậm.
            </div>
            <button
              onClick={() => {
                setUseMock(true);
                localStorage.setItem("USE_MOCK", "true");
                handleRefresh(true);
              }}
              className="mt-2 text-sm font-bold text-orange-700 dark:text-orange-300 underline"
            >
              Bật chế độ Demo
            </button>
          </div>
        )}

        {errorMsg && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl p-4">
            <div className="text-sm font-semibold text-red-700 dark:text-red-200">
              Lỗi: {errorMsg}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border dark:border-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                TỔNG HỒ SƠ GẤP
              </p>
              <Zap size={14} className="text-red-500" fill="currentColor" />
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {loading ? "..." : totalGap}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border dark:border-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                BỘ XÂY DỰNG
              </p>
              <Building2 size={14} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {loading ? "..." : totalBXD}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border dark:border-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                BỘ Y TẾ
              </p>
              <Stethoscope size={14} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {loading ? "..." : totalBYT}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border dark:border-gray-800 hidden md:block">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                TRẠNG THÁI
              </p>
              <div
                className={`w-2 h-2 rounded-full ${
                  loading ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                }`}
              />
            </div>
            <p className="text-sm font-bold mt-2 uppercase tracking-tight">
              {loading
                ? "Đang cập nhật"
                : hasFetched
                ? "Đã đồng bộ"
                : "Chưa tải"}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl max-w-2xl mx-auto shadow-inner">
          <button
            onClick={() => setActiveTab("BXD")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
              activeTab === "BXD"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md scale-[1.02]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <Building2 size={18} />
            BỘ XÂY DỰNG
            {totalGapBXD > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("BYT")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
              activeTab === "BYT"
                ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-md scale-[1.02]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <Stethoscope size={18} />
            BỘ Y TẾ
            {totalGapBYT > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {hasFetched && !loading && !errorMsg && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === "BXD" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                    <h2 className="text-lg font-bold uppercase tracking-tight">
                      Hệ thống Bộ Xây Dựng
                    </h2>
                  </div>
                  <div className="flex items-center text-xs font-medium text-gray-400 gap-1">
                    Thông tin <ChevronRight size={14} /> Hồ sơ
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <DossierTable
                    title="Hồ sơ cần xử lý (GẤP)"
                    data={boXayDung.gap}
                    variant="urgent"
                  />
                  <DossierTable
                    title="Hồ sơ đang xử lý"
                    data={boXayDung.dangXuLy}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-emerald-600 rounded-full"></div>
                    <h2 className="text-lg font-bold uppercase tracking-tight">
                      Hệ thống Bộ Y Tế
                    </h2>
                  </div>
                  <div className="flex items-center text-xs font-medium text-gray-400 gap-1">
                    Thông tin <ChevronRight size={14} /> Hồ sơ
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <DossierTable
                    title="Hồ sơ cần xử lý (GẤP)"
                    data={boYTe.gap}
                    variant="urgent"
                  />
                  <DossierTable
                    title="Hồ sơ đang xử lý"
                    data={boYTe.dangXuLy}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals (GIỮ CŨ) */}
      <LoginModal
        isOpen={showLogin && !useMock}
        isLoading={loginLoading}
        error={loginError}
        onLogin={onLogin}
      />

      {/* <TokenModal
        isOpen={showTokenModal && !useMock}
        isLoading={tokenSaving}
        error={tokenError}
        onSaveToken={onSaveToken}
        onClose={
          !loading && hasFetched ? () => setShowTokenModal(false) : undefined
        }
      /> */}
      <TokenModal
        isOpen={showTokenModal}
        targetMinistry={targetMinistry || "BXD"}
        onSaveToken={onSaveToken}
        onClose={() => setShowTokenModal(false)}
        isLoading={tokenSaving} // ✅ đổi chỗ này
      />

      {/* Settings */}
      {/* Settings Modal - GIỮ CODE CŨ */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-scale-in flex flex-col max-h-[90vh] transition-colors border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-600" />
                Cấu hình hệ thống
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ICONS.X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-6 px-1 pb-4">
              {/* Token Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <ICONS.ShieldCheck className="w-5 h-5" />
                  <span className="font-semibold text-sm">
                    Quản lý Token (Authorization)
                  </span>
                </div>

                {/* BXD Token Row */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-between group transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Bộ Xây dựng</p>
                      <p className="text-[10px] text-gray-500 uppercase font-medium">
                        Dịch vụ công BXD
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      setTargetMinistry("BXD");
                      setShowTokenModal(true);
                    }}
                    className="py-1.5 px-4 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
                  >
                    Cập nhật
                  </button>
                </div>

                {/* BYT Token Row */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-between group transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <Stethoscope size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Bộ Y tế</p>
                      <p className="text-[10px] text-gray-500 uppercase font-medium">
                        Dịch vụ công BYT
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      setTargetMinistry("BYT");
                      setShowTokenModal(true);
                    }}
                    className="py-1.5 px-4 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    Cập nhật
                  </button>
                </div>
              </div>

              {/* Demo Mode Section */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ICONS.Database className="w-5 h-5 text-yellow-600" />
                  <div>
                    <span className="font-bold text-sm text-yellow-800 dark:text-yellow-400">
                      Chế độ Demo
                    </span>
                    <p className="text-[10px] text-yellow-600/70">
                      Test UI không cần Token
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useMock}
                    onChange={async (e) => {
                      const v = e.target.checked;
                      setUseMock(v);
                      localStorage.setItem("USE_MOCK", String(v));
                      if (v) {
                        setShowLogin(false);
                        setShowTokenModal(false);
                        await handleRefresh(true);
                      } else {
                        const logged = await checkLoggedIn();
                        if (!logged) setShowLogin(true);
                        else await handleRefresh(false);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg italic">
                <ICONS.Info size={14} className="shrink-0" />
                <span>
                  Token được lưu trữ bảo mật trên server. Vui lòng không chia sẻ
                  Authorization Token cho người lạ.
                </span>
              </div>

              <button
                onClick={onLogout}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 transition-colors border border-red-100 dark:border-red-900/20"
              >
                <ICONS.LogOut className="w-4 h-4 mr-2" />
                Đăng xuất tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
