const mongoose = require('mongoose');
const Product = require('./models/Product');

// Kết nối tới MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/coffee-store', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Dữ liệu mẫu với tên ảnh có tiền tố "cf"
const seedProducts = [
    { name: 'Cà phê sữa đá', price: 25000, image: '/images/cfsuada.jfif' },
    { name: 'Cà phê đen đá', price: 20000, image: '/images/cfdenda.jfif' },
    { name: 'Cà phê Espresso', price: 30000, image: '/images/cfespresso.jfif' },
    { name: 'Cà phê Cappuccino', price: 35000, image: '/images/cfcapuchino.jfif' },
    { name: 'Cà phê Latte', price: 40000, image: '/images/cflatte.jfif' },
    { name: 'Cà phê Mocha', price: 45000, image: '/images/cfmocha.jfif' },
    { name: 'Cà phê Macchiato', price: 47000, image: '/images/cfmacchiato.jfif' },
    { name: 'Cà phê Americano', price: 30000, image: '/images/cfamericano.jfif' },
    { name: 'Trà đào cam sả', price: 35000, image: '/images/cftdcs.jfif' },
    { name: 'Trà sữa trân châu', price: 30000, image: '/images/cftstc.jfif' },
    { name: 'Sinh tố xoài', price: 35000, image: '/images/cfstxoai.jfif' },
    { name: 'Sinh tố bơ', price: 37000, image: '/images/cfstbo.jfif' },
    { name: 'Sinh tố dâu', price: 34000, image: '/images/cfstdau.jfif' },
    { name: 'Nước ép cam', price: 30000, image: '/images/cfnecam.jfif' },
    { name: 'Nước ép cà rốt', price: 28000, image: '/images/cfnecarot.jfif' },
    { name: 'Nước ép ổi', price: 29000, image: '/images/cfneoi.jfif' },
    { name: 'Sữa chua đánh đá', price: 32000, image: '/images/cfscdd.jfif' },
    { name: 'Nước suối', price: 10000, image: '/images/cfnsuoi.jfif' },
    { name: 'Trà xanh matcha', price: 45000, image: '/images/cftxmatcha.jfif' },
    { name: 'Chocolate nóng', price: 40000, image: '/images/cfchoco.jfif' },
];

// Xóa toàn bộ dữ liệu cũ và thêm dữ liệu mới
const seedDatabase = async () => {
    try {
        await Product.deleteMany({});
        console.log('✅ Removed all existing products');

        await Product.insertMany(seedProducts);
        console.log('✅ Seeded 20 products successfully');

        mongoose.connection.close();
    } catch (err) {
        console.error('❌ Error seeding data:', err);
        mongoose.connection.close();
    }
};

seedDatabase();