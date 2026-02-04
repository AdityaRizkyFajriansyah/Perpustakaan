const prisma = require("../config/prisma");

const getOverviewReportService = async () => {
  const now = new Date();
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalBooks,
    totalStudents,
    activeBorrowings,
    overdueBorrowings,
    reservationCount,
    lateFeeAgg,
    borrowingsTrendData,
    topBorrowed,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.borrowing.count({ where: { status: "DIPINJAM" } }),
    prisma.borrowing.count({ where: { status: "DIPINJAM", dueDate: { lt: now } } }),
    prisma.reservation.count({ where: { status: { in: ["ACTIVE", "READY"] } } }),
    prisma.borrowing.aggregate({ _sum: { lateFee: true } }),
    prisma.borrowing.findMany({
      where: { borrowDate: { gte: trendStart } },
      select: { borrowDate: true },
    }),
    prisma.borrowing.groupBy({
      by: ["bookId"],
      _count: { bookId: true },
      orderBy: { _count: { bookId: "desc" } },
      take: 5,
    }),
  ]);

  const trendBuckets = {};
  borrowingsTrendData.forEach((item) => {
    const date = item.borrowDate;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    trendBuckets[key] = (trendBuckets[key] || 0) + 1;
  });

  const topBookIds = topBorrowed.map((t) => t.bookId);
  const topBooks = topBookIds.length
    ? await prisma.book.findMany({ where: { id: { in: topBookIds } } })
    : [];
  const topBookMap = new Map(topBooks.map((b) => [b.id, b]));
  const topBorrowedBooks = topBorrowed.map((item) => ({
    bookId: item.bookId,
    title: topBookMap.get(item.bookId)?.title || "Unknown",
    totalBorrowed: item._count.bookId,
  }));

  return {
    totals: {
      totalBooks,
      totalStudents,
      activeBorrowings,
      overdueBorrowings,
      activeReservations: reservationCount,
      totalLateFees: lateFeeAgg._sum.lateFee || 0,
    },
    trends: trendBuckets,
    topBorrowedBooks,
  };
};

module.exports = { getOverviewReportService };
