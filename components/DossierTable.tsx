// src/components/DossierTable.tsx
import React, { useMemo } from "react";
import type { DossierItem } from "../types";

type Props = {
  title: string;
  data: DossierItem[];
  variant?: "urgent" | "normal";
};

/**
 * Build URL mở tab mới khi click vào MÃ HỒ SƠ.
 * Dựa theo pattern bạn đưa:
 * https://motcua.moh.gov.vn/vi/dossier/search/${id}? ... &procedure=...&remindId=...
 *
 * Lưu ý:
 * - Dùng URLSearchParams để tránh dính ký tự rác kiểu "Ư" khi copy/paste.
 * - encode tự động qua URLSearchParams.
 */
const buildMohSearchUrl = (dossier: any) => {
  const id = String(dossier?.id || "").trim();
  const base = `https://motcua.moh.gov.vn/vi/dossier/search/${encodeURIComponent(
    id
  )}`;

  // procedure: trong dữ liệu của bạn là dossier.procedure.id
  // nếu không có thì fallback theo bạn đưa
  const procedureId = String(
    dossier?.procedure?.id || "692e3dbf2fb610046865c419"
  ).trim();

  // remindId: trong link mẫu bạn đang để remindId=${procedure.id}
  // Nếu thực tế remindId là field khác, chỉ cần thay ở đây.
  const remindId = procedureId;

  const params = new URLSearchParams({
    code: "",
    identity: "",
    applicant: "",
    procedure: procedureId,
    sector: "",
    applyMethod: "",
    province: "",
    ward: "",
    ownerFullname: "",
    acceptFrom: "",
    acceptTo: "",
    status: "",
    remindId: remindId,
    sortId: "0",
    applicantOrganization: "",
    appointmentFrom: "",
    appointmentTo: "",
    resultReturnedFrom: "",
    resultReturnedTo: "",
    receiptCode: "",
    taxCode: "",
    resPerson: "",
    dossierProcessingStatus: "",
    phoneNumberApply: "",
    vnpostStatus: "",
  });

  return `${base}?${params.toString()}`;
};

const safeText = (v: any) => (v == null ? "" : String(v));

const fmtDateVi = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calcDaysLeft = (appointmentIso?: string) => {
  if (!appointmentIso) return null;
  const target = new Date(appointmentIso).getTime();
  if (Number.isNaN(target)) return null;

  // Làm tròn theo ngày, tính từ "bây giờ"
  const now = Date.now();
  const ms = target - now;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
};

const daysLeftLabel = (daysLeft: number | null) => {
  if (daysLeft == null) return "-";
  if (daysLeft > 0) return `Còn ${daysLeft} ngày`;
  if (daysLeft === 0) return "Hôm nay";
  return `Quá hạn ${Math.abs(daysLeft)} ngày`;
};

const getOwnerName = (dossier: any) => {
  // Ưu tiên applicant.data.ownerFullname -> applicant.data.fullname -> accepter.fullname
  const a = dossier?.applicant?.data;
  return (
    safeText(a?.ownerFullname) ||
    safeText(a?.fullname) ||
    safeText(dossier?.accepter?.fullname) ||
    "-"
  );
};

const getProcedureName = (dossier: any) => {
  // procedure.translate.name hoặc fallback
  return (
    safeText(dossier?.procedure?.translate?.name) ||
    safeText(dossier?.procedure?.name) ||
    "-"
  );
};

const getStatusName = (dossier: any) => {
  // dossierStatus.name hoặc dossierTaskStatus.name
  return (
    safeText(dossier?.dossierStatus?.name) ||
    safeText(dossier?.dossierTaskStatus?.name) ||
    "-"
  );
};

type Row = {
  key: string;
  code: string;
  mohUrl: string;
  procedureName: string;
  appointmentDateText: string;
  daysLeftText: string;
  daysLeftValue: number | null;
  ownerName: string;
  statusName: string;
};

const DossierTable: React.FC<Props> = ({ title, data, variant = "normal" }) => {
  const rows: Row[] = useMemo(() => {
    return (Array.isArray(data) ? data : []).map((x: any) => {
      const code = safeText(x?.code || x?.id || "-");
      const appointmentIso = safeText(x?.appointmentDate || "");
      const daysLeftValue = calcDaysLeft(appointmentIso);

      return {
        key: safeText(x?.id || code),
        code,
        mohUrl: buildMohSearchUrl(x),
        procedureName: getProcedureName(x),
        appointmentDateText: fmtDateVi(appointmentIso) || "-",
        daysLeftText: daysLeftLabel(daysLeftValue),
        daysLeftValue,
        ownerName: getOwnerName(x),
        statusName: getStatusName(x),
      };
    });
  }, [data]);

  const badgeClass =
    variant === "urgent"
      ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-900/40"
      : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-900/40";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-sm md:text-base">{title}</h3>
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full border ${badgeClass}`}
          >
            {rows.length} hồ sơ
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
          Không có dữ liệu.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr className="text-xs text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Mã hồ sơ
                </th>
                <th className="px-4 py-3 font-semibold min-w-[420px]">
                  Tên thủ tục
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Ngày hẹn trả
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Còn lại
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Chủ hồ sơ
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Trạng thái
                </th>
              </tr>
            </thead>

            <tbody className="divide-y dark:divide-gray-800">
              {rows.map((r) => (
                <tr
                  key={r.key}
                  className="text-sm hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  {/* CLICK VÀO MÃ HỒ SƠ => MỞ TAB MỚI */}
                  <td className="px-4 py-3 font-mono text-xs md:text-sm whitespace-nowrap">
                    <a
                      href={r.mohUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                      title="Mở hồ sơ trên motcua.moh.gov.vn"
                    >
                      {r.code}
                    </a>
                  </td>

                  <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                    <div className="line-clamp-2">{r.procedureName}</div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.appointmentDateText}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={[
                        "text-xs font-bold px-2 py-1 rounded-full border",
                        r.daysLeftValue == null
                          ? "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                          : r.daysLeftValue < 0
                          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40"
                          : r.daysLeftValue <= 2
                          ? "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-900/40"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40",
                      ].join(" ")}
                    >
                      {r.daysLeftText}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">{r.ownerName}</td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      {r.statusName}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DossierTable;
