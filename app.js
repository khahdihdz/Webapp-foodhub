// app.js - Cấu hình và Logic chính

// ============================================
// CẤU HÌNH - QUAN TRỌNG: Thay đổi các giá trị này
// ============================================

const CONFIG = {
    // Google Sheets API
    GOOGLE_SHEET_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
    
    // Telegram Bot
    TELEGRAM_BOT_TOKEN: 'YOUR_BOT_TOKEN',
    TELEGRAM_CHAT_ID: 'YOUR_CHAT_ID',
    
    // Địa chỉ Shop (tọa độ và địa chỉ)
    SHOP_LAT: 10.762622,  // Vĩ độ shop (ví dụ: Sài Gòn)
    SHOP_LNG: 106.660172, // Kinh độ shop
    SHOP_ADDRESS: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    
    // Phí vận chuyển
    BASE_SHIPPING_FEE: 10000, // 10k cho dưới 10km
    DISTANCE_THRESHOLD: 10,   // 10km
    EXTRA_FEE_PER_KM: 1000,   // 1k/km cho trên 10km
};

// ============================================
// STATE MANAGEMENT
// ============================================

let menuItems = [];
let cart = [];
let currentOrder = null;

// ============================================
// KHỞI TẠO ỨNG DỤNG
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

async function initApp() {
    displayShopAddress();
    await loadMenuFromGoogleSheets();
}

function displayShopAddress() {
    document.getElementById('shopAddress').textContent = CONFIG.SHOP_ADDRESS;
}

// ============================================
// LOAD DỮ LIỆU TỪ GOOGLE SHEETS
// ============================================

async function loadMenuFromGoogleSheets() {
    try {
        const response = await fetch(`${CONFIG.GOOGLE_SHEET_URL}?action=getMenu`);
        const data = await response.json();
        
        if (data.success) {
            menuItems = data.menu;
            displayMenu();
        } else {
            showError('Không thể tải thực đơn. Vui lòng thử lại sau.');
        }
    } catch (error) {
        console.error('Error loading menu:', error);
        // Hiển thị menu mẫu nếu không kết nối được
        loadSampleMenu();
    }
}

function loadSampleMenu() {
    menuItems = [
        {
            id: 1,
            name: 'Phở Bò Đặc Biệt',
            description: 'Phở bò với đầy đủ thịt, gân, sách',
            price: 45000,
            image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400'
        },
        {
            id: 2,
            name: 'Cơm Tấm Sườn Bì',
            description: 'Cơm tấm với sườn nướng và bì',
            price: 40000,
            image: 'https://images.unsplash.com/photo-1596040033229-a0b0c9b7a6e7?w=400'
        },
        {
            id: 3,
            name: 'Bánh Mì Thịt Nướng',
            description: 'Bánh mì giòn với thịt nướng thơm ngon',
            price: 25000,
            image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400'
        },
        {
            id: 4,
            name: 'Bún Bò Huế',
            description: 'Bún bò Huế cay nồng đậm đà',
            price: 42000,
            image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400'
        },
        {
            id: 5,
            name: 'Gỏi Cuốn Tôm Thịt',
            description: '5 cuốn gỏi cuốn tươi ngon với tôm và thịt',
            price: 35000,
            image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400'
        },
        {
            id: 6,
            name: 'Trà Sữa Trân Châu',
            description: 'Trà sữa ngọt ngào với trân châu dai',
            price: 28000,
            image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400'
        }
    ];
    displayMenu();
}

// ============================================
// HIỂN THỊ MENU
// ============================================

function displayMenu() {
    const container = document.getElementById('menuContainer');
    
    if (menuItems.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>Không có món ăn nào.</p></div>';
        return;
    }
    
    container.innerHTML = menuItems.map(item => `
        <div class="col-md-6 col-lg-4">
            <div class="card menu-card">
                <img src="${item.image}" alt="${item.name}">
                <div class="menu-card-body">
                    <h5 class="menu-card-title">${item.name}</h5>
                    <p class="menu-card-description">${item.description}</p>
                    <div class="menu-card-price">${formatCurrency(item.price)}</div>
                    <button class="btn btn-danger btn-add-to-cart" onclick="addToCart(${item.id})">
                        + Thêm vào giỏ
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// GIỎ HÀNG
// ============================================

function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    const existingItem = cart.find(i => i.id === itemId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    
    updateCart();
    showToast('Đã thêm vào giỏ hàng!');
}

function updateCartQuantity(itemId, change) {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== itemId);
    }
    
    updateCart();
}

function updateCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('subtotal');
    const totalAmountEl = document.getElementById('totalAmount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-muted text-center">Giỏ hàng trống</p>';
        subtotalEl.textContent = '0đ';
        totalAmountEl.textContent = '0đ';
        checkoutBtn.disabled = true;
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatCurrency(item.price)}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="btn btn-sm btn-outline-danger btn-quantity" onclick="updateCartQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="btn btn-sm btn-outline-danger btn-quantity" onclick="updateCartQuantity(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-total">${formatCurrency(item.price * item.quantity)}</div>
        </div>
    `).join('');
    
    subtotalEl.textContent = formatCurrency(subtotal);
    totalAmountEl.textContent = formatCurrency(subtotal);
    checkoutBtn.disabled = false;
}

// ============================================
// TÍNH TOÁN KHOẢNG CÁCH VÀ PHÍ SHIP
// ============================================

function calculateDistance(lat1, lon1, lat2, lon2) {
    // Công thức Haversine để tính khoảng cách giữa 2 điểm trên trái đất
    const R = 6371; // Bán kính trái đất (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

function calculateShippingFee(distance) {
    if (distance <= CONFIG.DISTANCE_THRESHOLD) {
        return CONFIG.BASE_SHIPPING_FEE;
    } else {
        const extraKm = Math.ceil(distance - CONFIG.DISTANCE_THRESHOLD);
        return CONFIG.BASE_SHIPPING_FEE + (extraKm * CONFIG.EXTRA_FEE_PER_KM);
    }
}

async function geocodeAddress(address) {
    // Sử dụng Nominatim API (OpenStreetMap) - miễn phí
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Vietnam')}&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

// ============================================
// ĐẶT HÀNG
// ============================================

function setupEventListeners() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    const confirmOrderBtn = document.getElementById('confirmOrderBtn');
    const reportBtn = document.getElementById('reportBtn');
    const submitReportBtn = document.getElementById('submitReportBtn');
    const customerAddress = document.getElementById('customerAddress');
    
    checkoutBtn.addEventListener('click', openCheckoutModal);
    confirmOrderBtn.addEventListener('click', confirmOrder);
    reportBtn.addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('reportModal'));
        modal.show();
    });
    submitReportBtn.addEventListener('click', submitReport);
    
    // Tự động tính phí ship khi nhập địa chỉ
    let addressTimeout;
    customerAddress.addEventListener('input', () => {
        clearTimeout(addressTimeout);
        addressTimeout = setTimeout(() => {
            calculateShippingFromAddress();
        }, 1000);
    });
}

function openCheckoutModal() {
    const modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    modal.show();
    calculateShippingFromAddress();
}

async function calculateShippingFromAddress() {
    const address = document.getElementById('customerAddress').value.trim();
    const distanceEl = document.getElementById('estimatedDistance');
    const shippingFeeEl = document.getElementById('modalShippingFee');
    const mainShippingFeeEl = document.getElementById('shippingFee');
    const totalAmountEl = document.getElementById('totalAmount');
    
    if (!address) {
        distanceEl.textContent = 'Chưa nhập địa chỉ';
        shippingFeeEl.textContent = '0đ';
        mainShippingFeeEl.textContent = '0đ';
        updateTotalAmount(0);
        return;
    }
    
    distanceEl.textContent = 'Đang tính...';
    
    const coords = await geocodeAddress(address);
    
    if (!coords) {
        distanceEl.textContent = 'Không tìm thấy địa chỉ';
        shippingFeeEl.textContent = '0đ';
        mainShippingFeeEl.textContent = '0đ';
        updateTotalAmount(0);
        return;
    }
    
    const distance = calculateDistance(
        CONFIG.SHOP_LAT,
        CONFIG.SHOP_LNG,
        coords.lat,
        coords.lng
    );
    
    const shippingFee = calculateShippingFee(distance);
    
    distanceEl.textContent = `${distance.toFixed(1)} km`;
    shippingFeeEl.textContent = formatCurrency(shippingFee);
    mainShippingFeeEl.textContent = formatCurrency(shippingFee);
    updateTotalAmount(shippingFee);
}

function updateTotalAmount(shippingFee) {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + shippingFee;
    document.getElementById('totalAmount').textContent = formatCurrency(total);
}

async function confirmOrder() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const note = document.getElementById('orderNote').value.trim();
    
    if (!name || !phone || !address) {
        showToast('Vui lòng điền đầy đủ thông tin!', 'warning');
        return;
    }
    
    const coords = await geocodeAddress(address);
    const distance = coords ? calculateDistance(
        CONFIG.SHOP_LAT,
        CONFIG.SHOP_LNG,
        coords.lat,
        coords.lng
    ) : 0;
    
    const shippingFee = coords ? calculateShippingFee(distance) : CONFIG.BASE_SHIPPING_FEE;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + shippingFee;
    
    const order = {
        orderId: generateOrderId(),
        customer: { name, phone, address },
        items: [...cart],
        subtotal,
        shippingFee,
        distance: distance.toFixed(1),
        total,
        note,
        timestamp: new Date().toISOString()
    };
    
    // Disable nút để tránh click nhiều lần
    const confirmBtn = document.getElementById('confirmOrderBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Đang gửi...';
    
    try {
        // Gửi đến Telegram
        await sendToTelegram(order);
        
        // Lưu vào Google Sheets
        await saveToGoogleSheets(order);
        
        // Hiển thị thành công
        showToast('Đặt hàng thành công! Chúng tôi sẽ liên hệ với bạn sớm.', 'success');
        
        // Reset
        cart = [];
        updateCart();
        bootstrap.Modal.getInstance(document.getElementById('checkoutModal')).hide();
        document.getElementById('orderForm').reset();
        
    } catch (error) {
        console.error('Order error:', error);
        showToast('Có lỗi xảy ra. Vui lòng thử lại!', 'danger');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Xác Nhận Đặt Hàng';
    }
}

// ============================================
// GỬI ĐƠN HÀNG QUA TELEGRAM
// ============================================

async function sendToTelegram(order) {
    const message = formatTelegramMessage(order);
    
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: CONFIG.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        })
    });
    
    if (!response.ok) {
        throw new Error('Telegram send failed');
    }
}

function formatTelegramMessage(order) {
    let message = `🔔 <b>ĐơN HÀNG MỚI #${order.orderId}</b>\n\n`;
    message += `👤 <b>Khách hàng:</b> ${order.customer.name}\n`;
    message += `📞 <b>SĐT:</b> ${order.customer.phone}\n`;
    message += `📍 <b>Địa chỉ:</b> ${order.customer.address}\n`;
    message += `📏 <b>Khoảng cách:</b> ${order.distance} km\n\n`;
    
    message += `🍽 <b>CHI TIẾT MÓN:</b>\n`;
    order.items.forEach(item => {
        message += `• ${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}\n`;
    });
    
    message += `\n💰 <b>THANH TOÁN:</b>\n`;
    message += `• Tổng món: ${formatCurrency(order.subtotal)}\n`;
    message += `• Phí ship: ${formatCurrency(order.shippingFee)}\n`;
    message += `• <b>TỔNG CỘNG: ${formatCurrency(order.total)}</b>\n`;
    
    if (order.note) {
        message += `\n📝 <b>Ghi chú:</b> ${order.note}\n`;
    }
    
    message += `\n🕐 ${formatDateTime(order.timestamp)}`;
    
    return message;
}

// ============================================
// LƯU VÀO GOOGLE SHEETS
// ============================================

async function saveToGoogleSheets(order) {
    try {
        const response = await fetch(CONFIG.GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'saveOrder',
                order: order
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            console.error('Google Sheets save failed:', data.message);
        }
    } catch (error) {
        console.error('Google Sheets error:', error);
        // Không throw error để không ảnh hưởng đến flow chính
    }
}

// ============================================
// BÁO LỖI
// ============================================

async function submitReport() {
    const name = document.getElementById('reporterName').value.trim();
    const description = document.getElementById('reportDescription').value.trim();
    
    if (!description) {
        showToast('Vui lòng mô tả lỗi!', 'warning');
        return;
    }
    
    const submitBtn = document.getElementById('submitReportBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi...';
    
    try {
        const message = `⚠️ <b>BÁO LỖI</b>\n\n` +
                       `👤 Người gửi: ${name || 'Ẩn danh'}\n` +
                       `📝 Mô tả: ${description}\n` +
                       `🕐 ${formatDateTime(new Date().toISOString())}`;
        
        const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        showToast('Đã gửi báo cáo. Cảm ơn bạn!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('reportModal')).hide();
        document.getElementById('reportForm').reset();
        
    } catch (error) {
        console.error('Report error:', error);
        showToast('Không thể gửi báo cáo. Vui lòng thử lại!', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Gửi Báo Cáo';
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateOrderId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return (timestamp + random).toUpperCase();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type = 'success') {
    // Tạo toast notification
    const toastContainer = document.createElement('div');
    toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    const bgColor = {
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        info: '#17a2b8'
    }[type] || '#28a745';
    
    toastContainer.innerHTML = `
        <div class="alert alert-${type}" style="
            background-color: ${bgColor};
            color: white;
            border: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            min-width: 250px;
        ">
            ${message}
        </div>
    `;
    
    document.body.appendChild(toastContainer);
    
    setTimeout(() => {
        toastContainer.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toastContainer.remove(), 300);
    }, 3000);
}

function showError(message) {
    const container = document.getElementById('menuContainer');
    container.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger">
                <h5>❌ Lỗi</h5>
                <p>${message}</p>
                <button class="btn btn-danger" onclick="location.reload()">Tải lại trang</button>
            </div>
        </div>
    `;
}

// CSS cho animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);