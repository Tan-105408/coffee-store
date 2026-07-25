const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    console.log('🚀 Đang xóa dữ liệu cũ...');
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Đang tạo 50 sản phẩm mẫu đa dạng...');

    const categories = ['Cà phê', 'Trà', 'Trà sữa', 'Bánh ngọt', 'Sinh tố', 'Nước ép'];
    const items = {
        'Cà phê': ['Espresso', 'Americano', 'Cappuccino', 'Latte', 'Mocha', 'Cà phê sữa đá'],
        'Trà': ['Trà đào', 'Trà vải', 'Trà sen vàng', 'Trà oolong'],
        'Trà sữa': ['Trà sữa truyền thống', 'Trà sữa trân châu', 'Trà sữa matcha'],
        'Bánh ngọt': ['Bánh Tiramisu', 'Bánh Mousse', 'Bánh Croissant'],
        'Sinh tố': ['Sinh tố dâu', 'Sinh tố bơ', 'Sinh tố xoài'],
        'Nước ép': ['Nước ép cam', 'Nước ép táo', 'Nước ép ổi']
    };
    const imageFiles = [
        'cfamericano.jfif', 'cfcapuchino.jfif', 'cfchoco.jfif', 'cfdenda.jfif', 'cfespresso.jfif',
        'cflatte.jfif', 'cfmacchiato.jfif', 'cfmocha.jfif', 'cfnecam.jfif', 'cfnecarot.jfif',
        'cfneoi.jfif', 'cfnsuoi.jfif', 'cfscdd.jfif', 'cfstbo.jfif', 'cfstdau.jfif',
        'cfstxoai.jfif', 'cfsuada.jfif', 'cftdcs.jfif', 'cftstc.jfif', 'cftxmatcha.jfif'
    ];

    const products = [];
    
    for (let i = 1; i <= 50; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const nameList = items[category];
        const name = nameList[Math.floor(Math.random() * nameList.length)];
        const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];

        products.push({
            name: `${name} ${i}`,
            price: (Math.floor(Math.random() * (70 - 25 + 1)) + 25) * 1000,
            image: `/images/${randomImage}`,
            category: category,
            discount: Math.random() > 0.8 ? 15 : 0,
        });
    }

    await prisma.product.createMany({
        data: products
    });

    console.log('✅ Đang tạo User Admin mẫu...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    await prisma.user.create({
        data: {
            username: 'admin',
            email: 'sutu567920@gmail.com',
            password: hashedPassword,
            role: 'admin',
            address: 'Admin Address'
        }
    });

    console.log('✅ Đang tạo Voucher mẫu...');
    const vouchers = await Promise.all([
      prisma.voucher.create({ data: { code: 'WELCOME10', description: 'Giảm 10% cho đơn đầu tiên', discountType: 'percent', discountValue: 10, minOrderValue: 50000, maxDiscount: 50000, isActive: true } }),
      prisma.voucher.create({ data: { code: 'SALE20', description: 'Giảm 20% đơn từ 200k', discountType: 'percent', discountValue: 20, minOrderValue: 200000, maxDiscount: 100000, isActive: true } }),
      prisma.voucher.create({ data: { code: 'FREESHIP', description: 'Miễn phí vận chuyển', discountType: 'fixed', discountValue: 30000, minOrderValue: 150000, isActive: true } }),
      prisma.voucher.create({ data: { code: 'SILVER50', description: 'Khách hàng thân thiết - giảm 50k', discountType: 'fixed', discountValue: 50000, minOrderValue: 300000, isActive: true } }),
      prisma.voucher.create({ data: { code: 'GOLD100', description: 'VIP - giảm 100k', discountType: 'fixed', discountValue: 100000, minOrderValue: 500000, isActive: true } }),
      prisma.voucher.create({ data: { code: 'BIG30', description: 'Giảm 30% đơn từ 500k', discountType: 'percent', discountValue: 30, minOrderValue: 500000, maxDiscount: 200000, isActive: true } }),
    ]);
    console.log(`✅ Đã tạo ${vouchers.length} voucher mẫu`);

    console.log('✅ Đang tạo Quy tắc Voucher mẫu...');
    // Rule: chi 500k → được WELCOME10 (dùng cho lần tiếp)
    await prisma.voucherRule.create({ data: { name: 'Khách mới đạt 500k', triggerType: 'totalSpend', threshold: 500000, voucherId: vouchers[0].id, isActive: true } });
    // Rule: chi 1tr → được SALE20
    await prisma.voucherRule.create({ data: { name: 'Thân thiết 1 triệu', triggerType: 'totalSpend', threshold: 1000000, voucherId: vouchers[1].id, isActive: true } });
    // Rule: 3 đơn → được FREESHIP
    await prisma.voucherRule.create({ data: { name: 'Khách quen 3 đơn', triggerType: 'orderCount', threshold: 3, voucherId: vouchers[2].id, isActive: true } });
    // Rule: chi 2tr → được SILVER50
    await prisma.voucherRule.create({ data: { name: 'Bạc 2 triệu', triggerType: 'totalSpend', threshold: 2000000, voucherId: vouchers[3].id, isActive: true } });
    // Rule: 5 đơn → được GOLD100
    await prisma.voucherRule.create({ data: { name: 'Vàng 5 đơn', triggerType: 'orderCount', threshold: 5, voucherId: vouchers[4].id, isActive: true } });
    // Rule: chi 5tr → được BIG30
    await prisma.voucherRule.create({ data: { name: 'Kim cương 5 triệu', triggerType: 'totalSpend', threshold: 5000000, voucherId: vouchers[5].id, isActive: true } });
    console.log('✅ Đã tạo 6 quy tắc voucher mẫu');

    console.log(`🎉 Hoàn tất! Đã thêm ${products.length} sản phẩm, 1 tài khoản Admin, ${vouchers.length} voucher và 6 quy tắc.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
