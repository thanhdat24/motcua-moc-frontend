// src/components/DossierTable.tsx
import React, { useMemo } from "react";
import type { DossierItem } from "../types";

type Ministry = "BXD" | "BYT";

type Props = {
  title: string;
  data: DossierItem[];
  ministry: Ministry;
  variant?: "urgent" | "normal";
};

const BASE_BYT = "https://motcua.moh.gov.vn";
const BASE_BXD = "https://motcuabxd.moc.gov.vn";

const safeText = (v: any) => (v == null ? "" : String(v));
const trim = (v: any) => safeText(v).trim();

/**
 * Convert timezone like +0700 -> +07:00 so Date() can parse reliably.
 * Also handles -0700.
 */
const normalizeIsoTz = (s?: string) => {
  const v = trim(s);
  if (!v) return "";
  return v.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
};

const toDate = (iso?: string) => {
  const v = normalizeIsoTz(iso);
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const fmtDateVi = (iso?: string) => {
  const d = toDate(iso);
  if (!d) return "-";
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Return time left/overdue in days/hours/minutes based on dueDate vs now.
 * - remaining: "Thời gian còn lại: X ngày Y giờ Z phút"
 * - overdue: "Đã quá hạn X ngày Y giờ Z phút"
 *
 * We use ceil(minutes) to avoid showing 0 phút when still a few seconds.
 */
const calcTimeDiffDHMS = (iso?: string) => {
  const d = toDate(iso);
  if (!d) return null;

  const diffMs = d.getTime() - Date.now(); // >0 remaining, <0 overdue
  const isOverdue = diffMs < 0;

  const absMs = Math.abs(diffMs);
  const totalMinutes = Math.ceil(absMs / (60 * 1000));

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return { isOverdue, days, hours, minutes };
};

const formatDuration = (days: number, hours: number, minutes: number) => {
  // Always show all parts to match your examples
  return `${days} ngày ${hours} giờ ${minutes} phút`;
};

const deadlineBadgeClass = (info: ReturnType<typeof calcTimeDiffDHMS>) => {
  if (!info)
    return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";

  if (info.isOverdue)
    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40";

  // If remaining <= 2 days => warning
  const remainingMinutes = info.days * 24 * 60 + info.hours * 60 + info.minutes;
  if (remainingMinutes <= 2 * 24 * 60)
    return "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-900/40";

  return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40";
};

const getOwnerName = (dossier: any) => {
  const a = dossier?.applicant?.data;
  return (
    trim(a?.ownerFullname) ||
    trim(a?.fullname) ||
    trim(dossier?.applicant?.fullname) ||
    trim(dossier?.accepter?.fullname) ||
    "-"
  );
};

const getProcedureName = (dossier: any) => {
  return (
    trim(dossier?.procedure?.translate?.name) ||
    trim(dossier?.procedure?.name) ||
    "-"
  );
};

const getStatusName = (dossier: any) => {
  return (
    trim(dossier?.dossierStatus?.name) ||
    trim(dossier?.dossierTaskStatus?.name) ||
    "-"
  );
};

const getDueDateFromCurrentTask = (dossier: any) => {
  const due = dossier?.currentTask?.[0]?.dueDate;
  return trim(due) || "";
};

/**
 * ✅ Lọc theo yêu cầu BXD:
 * - procedure.code !== "1.013225"
 * - statusName === "Đang xử lý"
 * (BYT giữ nguyên)
 */
const filterByMinistry = (ministry: Ministry, list: any[]) => {
  const arr = Array.isArray(list) ? list : [];
  if (ministry !== "BXD") return arr;

  return arr.filter((x) => {
    const procCode = trim(x?.procedure?.code);
    if (procCode === "1.013225") return false;

    const status =
      trim(x?.dossierStatus?.name) || trim(x?.dossierTaskStatus?.name);

    return status === "Đang xử lý";
  });
};

const buildSearchUrl = (ministry: Ministry, dossier: any) => {
  const base = ministry === "BYT" ? BASE_BYT : BASE_BXD;

  const id = trim(dossier?.id);
  if (!id) return base;

  const procedureId = trim(dossier?.procedure?.id) || "";
  const remindId = procedureId || "";

  const path = `/vi/dossier/search/${encodeURIComponent(id)}`;

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

  return `${base}${path}?${params.toString()}`;
};

type Row = {
  key: string;
  code: string;
  url: string;
  procedureName: string;

  appointmentText: string;

  dueDateText: string;
  deadlineText: string; // includes "Thời gian còn lại..." or "Đã quá hạn..."
  deadlineInfo: ReturnType<typeof calcTimeDiffDHMS>;

  ownerName: string;
  statusName: string;
};

const DossierTable: React.FC<Props> = ({
  title,
  data,
  ministry,
  variant = "normal",
}) => {
  const rows: Row[] = useMemo(() => {
    const filtered = filterByMinistry(ministry, data);

    return filtered.map((x: any) => {
      const code = trim(x?.code) || trim(x?.id) || "-";

      const appointmentIso = trim(x?.appointmentDate);
      const appointmentText = fmtDateVi(appointmentIso) || "-";

      const dueIso = getDueDateFromCurrentTask(x);
      const dueDateText = dueIso ? fmtDateVi(dueIso) : "-";

      const info = dueIso ? calcTimeDiffDHMS(dueIso) : null;
      let deadlineText = "-";
      if (info) {
        const dur = formatDuration(info.days, info.hours, info.minutes);
        deadlineText = info.isOverdue
          ? `Đã quá hạn ${dur}`
          : `Thời gian còn lại: ${dur}`;
      }

      return {
        key: trim(x?.id) || code,
        code,
        url: buildSearchUrl(ministry, x),
        procedureName: getProcedureName(x),
        appointmentText,
        dueDateText,
        deadlineText,
        deadlineInfo: info,
        ownerName: getOwnerName(x),
        statusName: getStatusName(x),
      };
    });
  }, [data, ministry]);

  const badgeClass =
    variant === "urgent"
      ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-900/40"
      : ministry === "BXD"
      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-900/40"
      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40";

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

        <div className="hidden md:block text-[11px] text-gray-500 dark:text-gray-400">
          <span className="font-semibold">Thời hạn</span> tính theo{" "}
          <span className="font-mono">currentTask[0].dueDate</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
          Không có dữ liệu phù hợp.
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
                <th className="px-4 py-3 font-semibold min-w-[320px]">
                  Thời hạn
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
                  <td className="px-4 py-3 font-mono text-xs md:text-sm whitespace-nowrap">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                      title="Mở hồ sơ trên hệ thống"
                    >
                      {r.code}
                    </a>
                  </td>

                  <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                    <div className="line-clamp-2">{r.procedureName}</div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.appointmentText}
                  </td>

                  {/* ✅ Thời hạn: có ngày + giờ + phút */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        Due: {r.dueDateText}
                      </span>

                      <span
                        className={[
                          "text-[11px] font-bold px-2 py-1 rounded-full border inline-flex w-fit",
                          deadlineBadgeClass(r.deadlineInfo),
                        ].join(" ")}
                        title="So sánh currentTask[0].dueDate với thời điểm hiện tại"
                      >
                        {r.deadlineText}
                      </span>
                    </div>
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
