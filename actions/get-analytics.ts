import { db } from "@/lib/db";

/** Revenue comes from course unlocks, grouped by course. */
export const getAnalytics = async (userId: string) => {
  try {
    const accesses = await db.courseAccess.findMany({
      where: {
        course: { userId },
      },
      select: {
        paidPrice: true,
        course: { select: { title: true, price: true } },
      },
    });

    const grouped: Record<string, number> = {};
    for (const access of accesses) {
      const title = access.course.title;
      // paidPrice is what it cost at unlock time; fall back to the current price.
      const amount = access.paidPrice ?? access.course.price ?? 0;
      grouped[title] = (grouped[title] ?? 0) + amount;
    }

    const data = Object.entries(grouped).map(([name, total]) => ({ name, total }));

    return {
      data,
      totalRevenue: data.reduce((sum, row) => sum + row.total, 0),
      // Each unlock is one sale.
      totalSales: accesses.length,
    };
  } catch (error) {
    console.error("[GET_ANALYTICS]", error);
    return { data: [], totalRevenue: 0, totalSales: 0 };
  }
};
