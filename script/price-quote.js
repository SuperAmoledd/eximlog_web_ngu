// Mobile Menu Toggle
function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

// Shipping Calculator Logic
function calculateShipping() {
    const country = document.getElementById('destCountry').value;
    const weightInput = document.getElementById('weight').value;
    const type = document.getElementById('type').value;
    const resultArea = document.getElementById('resultArea');
    const totalPriceEl = document.getElementById('totalPrice');
    const deliveryTimeEl = document.getElementById('deliveryTime');

    if (!weightInput || weightInput <= 0) {
        alert("Vui lòng nhập trọng lượng hợp lệ!");
        return;
    }

    const weight = parseFloat(weightInput);
    
    // Base rates per kg (Mock data - Giá giả lập)
    const rates = {
        usa: 220000,
        australia: 190000,
        canada: 210000,
        japan: 150000,
        korea: 140000,
        china: 60000
    };

    // Delivery time mock data
    const times = {
        usa: "3-5 ngày làm việc",
        australia: "3-4 ngày làm việc",
        canada: "4-6 ngày làm việc",
        japan: "2-3 ngày làm việc",
        korea: "2-3 ngày làm việc",
        china: "2-4 ngày làm việc"
    };

    let basePrice = rates[country] * weight;

    // Adjust price based on tiered pricing (Discount for heavier weights)
    if (weight > 10) basePrice = basePrice * 0.95; // Giảm 5% cho > 10kg
    if (weight > 20) basePrice = basePrice * 0.90; // Giảm 10% cho > 20kg

    // Adjust based on type
    if (type === 'special') basePrice = basePrice * 1.1; // Tăng 10% cho hàng khó
    
    // Formatting currency VNĐ
    const formatter = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    });

    // Display results
    totalPriceEl.textContent = formatter.format(basePrice);
    deliveryTimeEl.textContent = times[country];
    
    resultArea.classList.remove('hidden');
    resultArea.classList.add('block', 'animate-pulse');
    setTimeout(() => { resultArea.classList.remove('animate-pulse'); }, 500);
}