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
    partnersFooter.classList.remove('hidden');
}

function showErrorState(message) {
    skeletonLoader.classList.add('hidden');
    document.getElementById('skeleton-layout').classList.add('hidden');
    resultContainer.classList.add('hidden');
    partnersFooter.classList.remove('hidden');
    
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
    document.getElementById('info-send-date').textContent = formatDateTime(data.createdAt);
    
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
        // Sắp xếp: Mới nhất lên đầu
        const sortedHistory = [...data.history].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedHistory.forEach(entry => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="date">${formatDateTime(entry.date)}</span>
                <span class="status">${entry.status}</span>
                <span class="location">${data.toCountry || ''}</span> 
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

    // Timeout giả lập loading 1.5 giây cho trải nghiệm mượt mà
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
    }, 1500);
}

// Event Listeners
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

// Tự động tìm kiếm nếu có params ?code=...
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');

    if (codeFromUrl) {
        handleSearch(codeFromUrl);
    } else {
        showSearchState();
    }
});