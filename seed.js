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
            email: 'admin@coffeestore.com',
            password: hashedPassword,
            role: 'admin',
            address: 'Admin Address'
        }
    });

    console.log(`🎉 Hoàn tất! Đã thêm ${products.length} sản phẩm và 1 tài khoản Admin.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
