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

const formatDuration = (days: number, hours: number, minutes: number) =>
  `${days} ngày ${hours} giờ ${minutes} phút`;

const deadlineBadgeClass = (info: ReturnType<typeof calcTimeDiffDHMS>) => {
  if (!info)
    return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";

  if (info.isOverdue)
    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40";

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
    "-"
  );
};

const getProcedureName = (dossier: any) =>
  trim(dossier?.procedure?.translate?.name) ||
  trim(dossier?.procedure?.name) ||
  "-";

const getStatusName = (dossier: any) =>
  trim(dossier?.dossierStatus?.name) ||
  trim(dossier?.dossierTaskStatus?.name) ||
  "-";

const getDueDateFromCurrentTask = (dossier: any) =>
  trim(dossier?.currentTask?.[0]?.dueDate) || "";

const getAssigneeFromCurrentTask = (dossier: any) =>
  trim(dossier?.currentTask?.[0]?.assignee?.fullname) || "";
/**
 * ✅ Lọc theo yêu cầu BXD:
 * - procedure.code !== "1.013225"
 * - chỉ hiện thị trạng thái "Đang xử lý"
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
    remindId,
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
  deadlineText: string;
  deadlineInfo: ReturnType<typeof calcTimeDiffDHMS>;
  assigneeName: string;
  ownerName: string;
  statusName: string;
};

const HoverTooltip: React.FC<{ text: string; className?: string }> = ({
  text,
  className = "",
}) => {
  const t = (text || "").trim();
  if (!t) return <span className={className}>-</span>;

  return (
    <span className={`relative inline-block group max-w-full ${className}`}>
      <span className="block truncate">{t}</span>

      {/* Tooltip */}
      <span
        className="
          pointer-events-none
          absolute z-50
          left-0 top-full mt-2
          hidden group-hover:block
          w-max max-w-[320px]
          rounded-lg
          border border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-900
          px-3 py-2
          text-xs text-gray-900 dark:text-gray-100
          shadow-xl
          whitespace-normal break-words
        "
      >
        {t}
      </span>
    </span>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">
      {label}
    </span>
    <div className="text-sm text-gray-900 dark:text-gray-100">{children}</div>
  </div>
);

const DossierTable: React.FC<Props> = ({
  title,
  data,
  ministry,
  variant = "normal",
}) => {
  const rows: Row[] = useMemo(() => {
    const filtered = filterByMinistry(ministry, data);
    console.log("data", data);
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
        assigneeName: getAssigneeFromCurrentTask(x),
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
          Thời hạn theo{" "}
          <span className="font-mono">currentTask[0].dueDate</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
          Không có dữ liệu phù hợp.
        </div>
      ) : (
        <>
          {/* ✅ Desktop/Large: table view (không overflow-x-auto) */}
          <div className="hidden lg:block">
            <table className="w-full text-left table-fixed">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[34%]" />
                <col className="w-[14%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[8%]" />
              </colgroup>

              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr className="text-xs text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-semibold">Mã hồ sơ</th>
                  <th className="px-4 py-3 font-semibold">Tên thủ tục</th>
                  <th className="px-4 py-3 font-semibold">Ngày hẹn trả</th>
                  <th className="px-4 py-3 font-semibold">Thời hạn</th>
                  <th className="px-4 py-3 font-semibold">Chủ hồ sơ</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>

              <tbody className="divide-y dark:divide-gray-800">
                {rows.map((r) => (
                  <tr
                    key={r.key}
                    className="text-sm hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap overflow-hidden text-ellipsis">
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

                    <td className="px-4 py-3">
                      <div className="text-gray-900 dark:text-gray-100 line-clamp-2 break-words">
                        {r.procedureName}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.appointmentText}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          Hạn xử lý: {r.dueDateText}
                        </span>

                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          Người xử lý: {r.assigneeName ?? "—"}
                        </span>

                        <span
                          className={[
                            "text-[11px] font-bold px-2 py-1 rounded-full border inline-flex w-fit",
                            deadlineBadgeClass(r.deadlineInfo),
                          ].join(" ")}
                        >
                          {r.deadlineText}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">
                      <HoverTooltip text={r.ownerName} />
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        {r.statusName}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ✅ Mobile/Tablet: stacked card rows (không có thanh ngang) */}
          <div className="lg:hidden divide-y dark:divide-gray-800">
            {rows.map((r) => (
              <div
                key={r.key}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div className="grid grid-cols-1 gap-4">
                  <Field label="Mã hồ sơ">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-mono font-semibold break-all"
                    >
                      {r.code}
                    </a>
                  </Field>

                  <Field label="Tên thủ tục">
                    <div className="break-words">{r.procedureName}</div>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Ngày hẹn trả">{r.appointmentText}</Field>

                    <Field label="Trạng thái">
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 inline-flex">
                        {r.statusName}
                      </span>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Field label="Thời hạn">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          Hạn xử lý: {r.dueDateText}
                        </span>

                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          Người xử lý: {r.assigneeName ?? "—"}
                        </span>

                        <span
                          className={[
                            "text-[11px] font-bold px-2 py-1 rounded-full border inline-flex w-fit",
                            deadlineBadgeClass(r.deadlineInfo),
                          ].join(" ")}
                        >
                          {r.deadlineText}
                        </span>
                      </div>
                    </Field>

                    <Field label="Chủ hồ sơ">
                      <HoverTooltip text={r.ownerName} />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DossierTable;
