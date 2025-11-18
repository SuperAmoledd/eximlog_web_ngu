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
    resultContainer.classList.remove('hidden');
    partnersFooter.classList.remove('hidden');
    document.getElementById('skeleton-layout').classList.add('hidden');
}

function showErrorState(message) {
    skeletonLoader.classList.add('hidden');
    resultContainer.classList.add('hidden');
    partnersFooter.classList.remove('hidden');
    errorMessageResults.textContent = message;
    errorContainer.classList.remove('hidden');
    document.getElementById('skeleton-layout').classList.add('hidden');
}

function populateResults(data) {
    let latestStatus = { status: "Chưa có thông tin", date: data.createdAt };
    if (data.history && data.history.length > 0) {
        data.history.sort((a, b) => new Date(b.date) - new Date(a.date));
        latestStatus = data.history[0];
    }

    document.getElementById('status-text').textContent = latestStatus.status;
    document.getElementById('status-date').textContent = formatDateTime(latestStatus.date);
    document.getElementById('main-tracking-code').textContent = data.code;
    
    document.getElementById('info-from').textContent = data.fromCountry || 'N/A';
    document.getElementById('info-carrier').textContent = 'UPS';
    document.getElementById('info-to').textContent = data.toCountry || 'N/A';
    document.getElementById('info-send-date').textContent = formatDateTime(data.createdAt);
    document.getElementById('info-sub-tracking').textContent = data.history[0]?.subTracking || 'N/A';
    
    document.getElementById('service-type').textContent = 'KSN-SEA-USA-UPS';
    document.getElementById('service-term').textContent = 'Người gửi';

    document.getElementById('detail-packaging').textContent = 'Thùng carton';
    document.getElementById('detail-pieces').textContent = `${data.packages || 0} Cái`;

    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    if (data.history && data.history.length > 0) {
        data.history.forEach(entry => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="date">${formatDateTime(entry.date)}</span>
                <span class="status">${entry.status}</span>
                <span class="location">${data.toCountry || 'Đang xử lý'}</span>
            `;
            historyList.appendChild(li);
        });
    } else {
        historyList.innerHTML = '<li>Không có lịch sử vận đơn.</li>';
    }
    
    const subTable = document.getElementById('sub-details-table').querySelector('tbody');
    subTable.innerHTML = `
        <tr>
            <td>${data.code.slice(0, 8)}</td>
            <td>1Z4E2W090318383823</td>
        </tr>
    `;
}

async function handleSearch(code) {
    if (!code) {
        showSearchState();
        errorMessageLanding.textContent = 'Vui lòng nhập mã vận đơn.';
        errorMessageLanding.classList.remove('hidden');
        return;
    }
    const newUrl = `${window.location.pathname}?code=${code}`;
    window.history.pushState({path: newUrl}, '', newUrl);
    errorMessageLanding.classList.add('hidden');

    showSkeletonState();
    
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
    }, 2000);
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
    // 1. Lấy tham số từ URL trình duyệt
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');

    // 2. Nếu có mã 'code' trên URL -> Tự động tìm kiếm
    if (codeFromUrl) {
        handleSearch(codeFromUrl);
    } else {
        // 3. Nếu không có -> Hiện ô nhập liệu như bình thường
        showSearchState();
    }
});