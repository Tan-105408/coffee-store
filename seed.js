const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Đang xóa dữ liệu cũ...');
    // Xóa theo thứ tự để tránh lỗi ràng buộc khóa ngoại
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Đang tạo 50 sản phẩm mẫu (Trà, Cà phê, Trà sữa)...');

    const coffeeNames = ['Espresso', 'Americano', 'Cappuccino', 'Latte', 'Mocha', 'Macchiato', 'Cà phê sữa đá', 'Cà phê đen đá', 'Cà phê trứng', 'Cà phê muối'];
    const teaNames = ['Trà đào cam sả', 'Trà thạch vải', 'Trà dâu tây', 'Trà sen vàng', 'Trà hoa cúc', 'Trà thiết quan âm', 'Trà oolong', 'Trà nhài'];
    const milkTeaNames = ['Trà sữa truyền thống', 'Trà sữa trân châu đen', 'Trà sữa khoai môn', 'Trà sữa matcha', 'Trà sữa socola', 'Trà sữa Hokkaido', 'Trà sữa Okinawa'];

    const images = [
        '/images/cfsuada.jfif', '/images/cfdenda.jfif', '/images/cfespresso.jfif',
        '/images/cfcapuchino.jfif', '/images/cflatte.jfif', '/images/cfmocha.jfif',
        '/images/cfmacchiato.jfif', '/images/cfamericano.jfif', '/images/cftdcs.jfif',
        '/images/cftstc.jfif'
    ];

    const products = [];
    
    // Tạo khoảng 50 sản phẩm
    for (let i = 1; i <= 50; i++) {
        let name, category;
        const rand = Math.random();
        
        if (rand < 0.4) {
            name = coffeeNames[Math.floor(Math.random() * coffeeNames.length)];
            category = 'Cà phê';
        } else if (rand < 0.7) {
            name = teaNames[Math.floor(Math.random() * teaNames.length)];
            category = 'Trà trái cây';
        } else {
            name = milkTeaNames[Math.floor(Math.random() * milkTeaNames.length)];
            category = 'Trà sữa';
        }

        products.push({
            name: name + ' ' + (Math.random() > 0.5 ? 'Đậm Vị' : 'Thơm Ngon'), // Add suffix for variety instead of #i
            price: (Math.floor(Math.random() * (60 - 20 + 1)) + 20) * 1000,
            image: images[Math.floor(Math.random() * images.length)],
            category: category,
            discount: Math.random() > 0.8 ? 15 : 0,
        });
    }

    await prisma.product.createMany({
        data: products
    });

    console.log('✅ Đang tạo User mẫu...');
    await prisma.user.create({
        data: {
            username: 'tan',
            email: 'admin@coffeestore.com',
            password: '123456', // Trong thực tế hãy dùng bcrypt
            role: 'admin',
            address: '123 Đường ABC, Quận 1, TP.HCM'
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
