// src/components/DossierTable.tsx
import React, { useMemo } from "react";
import { FileText, Clock, User, BadgeCheck } from "lucide-react";

type Props = {
  title: string;
  data: any[]; // nhận raw dossier từ API
  variant?: "urgent" | "normal";
};

type Row = {
  key: string;
  code: string;
  procedureName: string;
  appointmentDateText: string;
  daysLeftText: string;
  daysLeftValue: number | null; // để sort / màu
  ownerName: string;
  statusName: string;
};

const fmtDateVi = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso; // fallback nếu parse lỗi
  return d.toLocaleDateString("vi-VN");
};

const calcDaysLeft = (iso?: string): number | null => {
  if (!iso) return null;
  const due = new Date(iso).getTime();
  if (Number.isNaN(due)) return null;

  const now = Date.now();
  const diffMs = due - now;
  // Ceil để “còn 0.2 ngày” vẫn hiện 1 ngày
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const daysLeftLabel = (d: number | null) => {
  if (d === null) return "-";
  if (d > 0) return `Còn ${d} ngày`;
  if (d === 0) return "Hôm nay";
  return `Quá hạn ${Math.abs(d)} ngày`;
};

const safeText = (v: any, fallback = "-") => {
  const s = (v ?? "").toString().trim();
  return s ? s : fallback;
};

const mapDossierToRow = (x: any): Row => {
  const code = safeText(x?.code);

  const procedureName = safeText(
    x?.procedure?.translate?.name || x?.procedure?.name || x?.procedure?.code
  );

  const appointmentIso: string | undefined = x?.appointmentDate;
  const daysLeftValue = calcDaysLeft(appointmentIso);

  // Chủ hồ sơ: ưu tiên eForm.data.ownerFullname (thực tế hay đúng)
  const ownerName = safeText(
    x?.eForm?.data?.ownerFullname ||
      x?.applicant?.data?.ownerFullname ||
      x?.applicant?.data?.fullname ||
      x?.applicant?.data?.nycHoTen ||
      x?.applicant?.data?.originNycHoTen
  );

  const statusName = safeText(
    x?.dossierStatus?.name || x?.dossierTaskStatus?.name
  );

  return {
    key: safeText(x?.id || code),
    code,
    procedureName,
    appointmentDateText: fmtDateVi(appointmentIso) || "-",
    daysLeftText: daysLeftLabel(daysLeftValue),
    daysLeftValue,
    ownerName,
    statusName,
  };
};

const badgeDaysClass = (days: number | null) => {
  if (days === null) return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  if (days < 0) return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300";
  if (days === 0) return "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300";
  if (days <= 3) return "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
  return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300";
};

const badgeStatusClass = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("đang xử lý")) return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300";
  if (s.includes("đã tiếp nhận")) return "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300";
  if (s.includes("hoàn thành") || s.includes("đã trả")) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300";
  if (s.includes("từ chối") || s.includes("hủy")) return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300";
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
};

const DossierTable: React.FC<Props> = ({ title, data, variant = "normal" }) => {
  const rows = useMemo(() => (Array.isArray(data) ? data.map(mapDossierToRow) : []), [data]);

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 overflow-hidden ${
        variant === "urgent" ? "ring-1 ring-red-200 dark:ring-red-900/40" : ""
      }`}
    >
      <div className="px-5 py-4 border-b dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-lg ${
              variant === "urgent"
                ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300"
                : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300"
            }`}
          >
            <FileText size={18} />
          </div>
          <div className="flex flex-col">
            <div className="font-bold text-sm md:text-base">{title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Tổng: <span className="font-semibold">{rows.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Mã hồ sơ</th>
              <th className="text-left px-4 py-3 font-semibold min-w-[420px]">Tên thủ tục</th>
              <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} /> Ngày hẹn trả
                </span>
              </th>
              <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Còn lại</th>
              <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <User size={14} /> Chủ hồ sơ
                </span>
              </th>
              <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <BadgeCheck size={14} /> Trạng thái
                </span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y dark:divide-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                  Không có dữ liệu.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs md:text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {r.code}
                  </td>

                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    <div className="line-clamp-2">{r.procedureName}</div>
                  </td>

                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    {r.appointmentDateText}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${badgeDaysClass(r.daysLeftValue)}`}>
                      {r.daysLeftText}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    {r.ownerName}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${badgeStatusClass(r.statusName)}`}>
                      {r.statusName}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DossierTable;
