"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CourseRow, MonthPoint } from "@/actions/get-teacher-dashboard";

const axis = {
  stroke: "#94a3b8",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

/** Shared tooltip so every chart reads the same, and reads right-to-left. */
const tooltipStyle = {
  contentStyle: {
    direction: "rtl" as const,
    borderRadius: "0.5rem",
    border: "1px solid rgba(148,163,184,0.3)",
    background: "rgba(15,23,42,0.95)",
    color: "#fff",
    fontSize: 12,
  },
  labelStyle: { color: "#94a3b8" },
  cursor: { fill: "rgba(148,163,184,0.12)" },
};

const ChartFrame = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
    <div className="mb-4">
      <h3 className="font-semibold">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
    {children}
  </div>
);

const Empty = ({ height = 260 }: { height?: number }) => (
  <div
    style={{ height }}
    className="flex items-center justify-center text-sm text-muted-foreground"
  >
    لسه مفيش بيانات كفاية
  </div>
);

export const RevenueChart = ({ data }: { data: MonthPoint[] }) => {
  const hasData = data.some((point) => point.revenue > 0);

  return (
    <ChartFrame title="الإيرادات" subtitle="آخر 12 شهراً">
      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,0.2)"
              vertical={false}
            />
            <XAxis dataKey="label" {...axis} />
            <YAxis {...axis} width={56} />
            <Tooltip
              {...tooltipStyle}
              formatter={(value: number) => [`${value} جنية`, "الإيرادات"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#revenueFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <Empty />
      )}
    </ChartFrame>
  );
};

export const EnrollmentsChart = ({ data }: { data: MonthPoint[] }) => {
  const hasData = data.some((point) => point.enrollments > 0);

  return (
    <ChartFrame title="عمليات الفتح" subtitle="عدد الطلاب الجدد شهرياً">
      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,0.2)"
              vertical={false}
            />
            <XAxis dataKey="label" {...axis} />
            <YAxis {...axis} width={56} allowDecimals={false} />
            <Tooltip {...tooltipStyle} formatter={(value: number) => [value, "طالب"]} />
            <Bar
              dataKey="enrollments"
              fill="#0ea5e9"
              radius={[4, 4, 0, 0]}
              maxBarSize={44}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Empty />
      )}
    </ChartFrame>
  );
};

export const CourseRevenueChart = ({ data }: { data: CourseRow[] }) => {
  const rows = data.filter((row) => row.revenue > 0 || row.students > 0);

  return (
    <ChartFrame title="الأداء حسب الدرس" subtitle="الإيرادات وعدد الطلاب">
      {rows.length ? (
        <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 56)}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,0.2)"
              horizontal={false}
            />
            <XAxis type="number" {...axis} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="title"
              {...axis}
              width={120}
              tickFormatter={(value: string) =>
                value.length > 16 ? `${value.slice(0, 16)}…` : value
              }
            />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, direction: "rtl" }} />
            <Bar
              dataKey="revenue"
              name="الإيرادات"
              fill="#10b981"
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
            />
            <Bar
              dataKey="students"
              name="الطلاب"
              fill="#6366f1"
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Empty height={220} />
      )}
    </ChartFrame>
  );
};

const ACCESS_COLORS = ["#10b981", "#37B7C3", "#64748b"];

/** How students got to their courses: opened by hand, or free to watch. */
export const AccessChart = ({
  granted,
  free,
}: {
  granted: number;
  free: number;
}) => {
  const data = [
    { name: "مفتوح يدوياً", value: granted },
    { name: "دروس مجانية", value: free },
  ].filter((slice) => slice.value > 0);

  return (
    <ChartFrame title="مصدر الالتحاق" subtitle="الطلبة وصلوا لدروسك إزاي">
      {data.length ? (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={96}
              paddingAngle={3}
            >
              {data.map((slice, index) => (
                <Cell
                  key={slice.name}
                  fill={ACCESS_COLORS[index % ACCESS_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              {...tooltipStyle}
              formatter={(value: number) => [value, "التحاق"]}
            />
            <Legend wrapperStyle={{ fontSize: 12, direction: "rtl" }} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <Empty />
      )}
    </ChartFrame>
  );
};
