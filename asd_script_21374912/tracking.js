const API_URL = 'https://213cmhft-3000.asse.devtunnels.ms/api/track';

const searchSection = document.getElementById('search-section');
const resultsPageWrapper = document.getElementById('results-page-wrapper');
const partnersFooter = document.querySelector('.partners');
const mainContainer = document.querySelector('.main-container');

const skeletonLoader = document.getElementById('skeletonLoader');
const resultContainer = document.getElementById('resultContainer');
const errorContainer = document.getElementById('errorContainer');

const trackingFormLanding = document.getElementById('form-on-tracking');
const trackingCodeInputLanding = document.getElementById('trackingCodeInput');
const errorMessageLanding = document.getElementById('error-message-landing');

const trackingFormHeader = document.getElementById('form-in-header');
const trackingCodeInputHeader = document.getElementById('trackingCodeInputHeader');
const errorMessageResults = document.getElementById('error-message-results');

function formatDateTime(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const day = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${time}, ${day}`;
    } catch (error) {
        return 'N/A';
    }
}

function showSearchState() {
    searchSection.classList.remove('hidden');
    resultsPageWrapper.classList.add('hidden');
    partnersFooter.classList.remove('hidden'); 
    errorMessageLanding.classList.add('hidden');
    mainContainer.style.justifyContent = 'center';
}

function showSkeletonState() {
    searchSection.classList.add('hidden');
    partnersFooter.classList.add('hidden'); 
    resultsPageWrapper.classList.remove('hidden');
    
    document.getElementById('skeleton-layout').classList.remove('hidden'); 
    skeletonLoader.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');
    
    mainContainer.style.justifyContent = 'flex-start';
}

function showResultState() {
    skeletonLoader.classList.add('hidden');
    document.getElementById('skeleton-layout').classList.add('hidden'); 
    resultContainer.classList.remove('hidden');
    partnersFooter.classList.add('hidden'); 
}

function showErrorState(message) {
    skeletonLoader.classList.add('hidden');
    document.getElementById('skeleton-layout').classList.add('hidden');
    resultContainer.classList.add('hidden');
    partnersFooter.classList.add('hidden'); 
    
    errorMessageResults.textContent = message;
    errorContainer.classList.remove('hidden');
}

function populateResults(data) {
    let latestStatus = { status: "Chưa có thông tin", date: data.createdAt };
    if (data.history && data.history.length > 0) {
        const sortedHistory = [...data.history].sort((a, b) => new Date(b.date) - new Date(a.date));
        latestStatus = sortedHistory[0];
    }

    document.getElementById('status-text').textContent = latestStatus.status;
    document.getElementById('status-date').textContent = formatDateTime(latestStatus.date);
    document.getElementById('main-tracking-code').textContent = data.code;

    document.getElementById('info-from').textContent = data.fromCountry || 'Việt Nam';
    document.getElementById('info-to').textContent = data.toCountry || 'N/A';
    // document.getElementById('info-send-date').textContent = formatDateTime(data.createdAt);
    document.getElementById('info-send-date').textContent = new Date(data.createdAt).toLocaleDateString('vi-VN');
    
    document.getElementById('info-carrier').textContent = data.carrier || 'Chưa cập nhật';
    document.getElementById('info-sub-tracking').textContent = data.subTracking || 'N/A';
    
    document.getElementById('service-type').textContent = data.serviceType || 'Standard Shipping';
    document.getElementById('service-term').textContent = 'N/A'; 

    document.getElementById('detail-packaging').textContent = data.packaging || 'Thùng carton';
    document.getElementById('detail-pieces').textContent = `${data.packages || 0} Kiện`;
    document.getElementById('detail-weight').textContent = `${data.weight || 0} Kg`;

    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    if (data.history && data.history.length > 0) {
        const sortedHistory = [...data.history].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedHistory.forEach((entry, index) => {
        const dateObj = new Date(entry.date);
        const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

        let locationDisplay = '';
        
        // Vì mảng đã sort Mới -> Cũ, nên phần tử cuối cùng (length - 1) là cái cũ nhất.
        const isFirstStatus = (index === sortedHistory.length - 1);

        if (entry.location && entry.location.trim() !== "") {
            // 1. Nếu admin có nhập tay vị trí -> Ưu tiên hiển thị
            locationDisplay = entry.location;
        } else if (isFirstStatus) {
            // 2. Nếu là dòng khởi tạo đầu tiên -> Mặc định là HCM
            locationDisplay = 'Ho Chi Minh, VN'; 
        } else {
            // 3. Các trạng thái trung gian nếu không nhập vị trí -> Lấy nước đến
            locationDisplay = data.toCountry || 'Đang vận chuyển';
        }
        // ---------------------

        const li = document.createElement('li');
        li.innerHTML = `
            <div class="time-col">
                <span class="time-part">${timeStr}</span>
                <span class="date-part">${dateStr}</span>
            </div>
            <div class="dot"></div>
            <div class="content-col">
                <span class="status">${entry.status}</span>
                <span class="location"><i class="fas fa-map-marker-alt"></i> ${locationDisplay}</span>
            </div>
        `;
        historyList.appendChild(li);
    });
} else {
    historyList.innerHTML = '<li>Chưa có lịch sử vận đơn.</li>';
}
    
}

async function handleSearch(code) {
    if (!code) {
        showSearchState();
        errorMessageLanding.textContent = 'Vui lòng nhập mã vận đơn.';
        errorMessageLanding.classList.remove('hidden');
        return;
    }
    
    // Cập nhật URL
    const newUrl = `${window.location.pathname}?code=${code}`;
    window.history.pushState({path: newUrl}, '', newUrl);
    
    errorMessageLanding.classList.add('hidden');

    // Chuyển sang màn hình Skeleton Loading
    showSkeletonState();
    
    // Đồng bộ input
    trackingCodeInputLanding.value = code;
    trackingCodeInputHeader.value = code;

    setTimeout(async () => {
        try {
            const res = await fetch(`${API_URL}?code=${code}`);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Lỗi không xác định');
            }
            const data = await res.json();

            populateResults(data);
            showResultState();

        } catch (err) {
            showErrorState(err.message || 'Không tìm thấy mã vận đơn.');
        }
    }, 800);
}

trackingFormLanding.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = trackingCodeInputLanding.value.trim();
    handleSearch(code);
});

trackingFormHeader.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = trackingCodeInputHeader.value.trim();
    handleSearch(code);
});

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');

    if (codeFromUrl) {
        handleSearch(codeFromUrl);
    } else {
        showSearchState();
    }
});

// --- PARTNER CAROUSEL LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.carousel-item');
    if (!items.length) return;

    let currentIndex = 0;
    const totalItems = items.length;

    function updateCarousel() {
        // Xóa hết class cũ
        items.forEach(item => {
            item.classList.remove('active', 'prev', 'next');
        });

        // Tính toán chỉ số (index) cho 3 vị trí
        // 1. Active: Phần tử hiện tại
        const activeIndex = currentIndex;
        
        // 2. Prev: Phần tử bên trái (lùi lại 1, nếu < 0 thì quay về cuối)  
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = totalItems - 1;

        // 3. Next: Phần tử bên phải (tiến lên 1, nếu quá tổng thì quay về đầu)
        let nextIndex = currentIndex + 1;
        if (nextIndex >= totalItems) nextIndex = 0;

        // Gán class
        items[activeIndex].classList.add('active'); // Giữa
        items[prevIndex].classList.add('prev');     // Trái
        items[nextIndex].classList.add('next');     // Phải

        currentIndex++;
        if (currentIndex >= totalItems) currentIndex = 0;
    }

    updateCarousel();

    setInterval(updateCarousel, 2000);
});