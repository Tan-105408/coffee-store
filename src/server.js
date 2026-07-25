
const app = require("./app");
const connectDB = require("./config/db");
const { port } = require("./config/env");
const { prisma } = require("./config/db");

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });

  // ── Auto-complete orders after 3-5 min in "processing" ──
  const COMPLETE_AFTER_MS = 3 * 60 * 1000; // 3 minutes base
  setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - COMPLETE_AFTER_MS);
      const updated = await prisma.order.updateMany({
        where: {
          status: "processing",
          updatedAt: { lte: cutoff },
        },
        data: {
          status: "completed",
          paymentStatus: "completed",
          updatedAt: new Date(),
        },
      });
      if (updated.count > 0) {
        console.log(`[Auto] Completed ${updated.count} order(s)`);
        // Trigger voucher auto-assign for each
        const orders = await prisma.order.findMany({
          where: {
            status: "completed",
            paymentStatus: "completed",
            updatedAt: { gte: new Date(Date.now() - 60000) },
          },
          select: { userId: true, totalAmount: true },
        });
        const { checkAutoAssignment } = require("./modules/vouchers/vouchers.service");
        for (const o of orders) {
          checkAutoAssignment(o.userId, o.totalAmount).catch(() => {});
        }
      }
    } catch (err) {
      console.error("[Auto] Order completion error:", err.message);
    }
  }, 60_000); // check every 60s
});
