// Tự động phân giải endpoint API tracking theo môi trường localhost / production
const getApiBaseUrl = () => {
    const host = window.location.hostname;
    const port = window.location.port;
    if (host === 'eximlog.vn' || host === 'www.eximlog.vn') {
        return 'https://dashboard.eximlog.vn/api/track';
    }
    // Hỗ trợ khi mở trực tiếp file HTML hoặc mở qua Live Server (port 5500...)
    if (window.location.protocol === 'file:' || (host === 'localhost' && port !== '3000' && port !== '')) {
        return 'http://localhost:3000/api/track';
    }
    return '/api/track';
};
const API_URL = getApiBaseUrl();

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

// State for timeline collapse/expand
let isTimelineExpanded = false;

/* =========================================
   UTILITIES & FORMATTERS
   ========================================= */

function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function sanitizeText(value, fallback = '---') {
    if (value === null || value === undefined) return fallback;
    const str = String(value).trim();
    if (str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str.toLowerCase() === 'n/a') {
        return fallback;
    }
    return str;
}

function formatDateTime(isoString) {
    if (!isoString) return '---';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '---';
        const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const day = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${time}, ${day}`;
    } catch (error) {
        return '---';
    }
}

function formatDateHeader(dateObj) {
    try {
        const now = new Date();
        const isToday = (
            dateObj.getDate() === now.getDate() &&
            dateObj.getMonth() === now.getMonth() &&
            dateObj.getFullYear() === now.getFullYear()
        );

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = (
            dateObj.getDate() === yesterday.getDate() &&
            dateObj.getMonth() === yesterday.getMonth() &&
            dateObj.getFullYear() === yesterday.getFullYear()
        );

        const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

        if (isToday) return `Hôm nay, ${dateStr}`;
        if (isYesterday) return `Hôm qua, ${dateStr}`;

        const weekday = dateObj.toLocaleDateString('vi-VN', { weekday: 'long' });
        const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
        return `${capitalizedWeekday}, ${dateStr}`;
    } catch (e) {
        return 'Ngày cập nhật';
    }
}

/**
 * Chuẩn hóa các thuật ngữ trạng thái quốc tế (DHL, FedEx, UPS, hàng không)
 * sang tiếng Việt tự nhiên, chính xác, không làm sai lệch ý nghĩa.
 */
function normalizeCarrierStatus(rawStatus) {
    if (!rawStatus) return "Chưa có thông tin";
    const cleaned = String(rawStatus).trim();

    // Nếu đã là tiếng Việt (chứa ký tự có dấu), giữ nguyên text gốc của người dùng
    const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(cleaned);
    if (hasVietnamese) {
        return cleaned;
    }

    const lower = cleaned.toLowerCase();

    // Chỉ chuẩn hóa/dịch khi là thuật ngữ tiếng Anh từ hãng quốc tế
    if (lower === 'delivered' || lower.includes('delivered successfully')) {
        return 'Phát hàng thành công';
    }
    if (lower.includes('out for delivery') || lower.includes('with delivery courier')) {
        return 'Đang phát hàng tới người nhận';
    }
    if (lower.includes('customs clearance completed') || lower.includes('cleared customs')) {
        return 'Hoàn tất thủ tục thông quan';
    }
    if (lower.includes('held by customs')) {
        return 'Kiện hàng đang được cơ quan hải quan giữ lại kiểm tra';
    }
    if (lower.includes('customs')) {
        return 'Đang kiểm tra hải quan';
    }
    if (lower.includes('departed facility') || lower.includes('departed from')) {
        return 'Đã xuất phát từ trạm trung chuyển';
    }
    if (lower.includes('arrived at facility') || lower.includes('arrived at sort')) {
        return 'Đã đến trung tâm phân loại / trung chuyển';
    }
    if (lower.includes('in transit') || lower.includes('shipment in transit') || lower.includes('transiting')) {
        return 'Đang vận chuyển trung chuyển';
    }
    if (lower.includes('picked up') || lower.includes('shipment picked up')) {
        return 'Đã tiếp nhận hàng bưu phẩm';
    }
    if (lower.includes('shipment information received') || lower.includes('data received')) {
        return 'Đã tạo mã vận đơn điện tử';
    }
    if (lower === 'delay' || lower === 'exception') {
        return 'Hành trình đang gặp chậm trễ phát sinh';
    }

    return cleaned;
}

/**
 * Phân loại trạng thái để gán màu sắc và cập nhật stepper
 */
function getStatusCategory(statusText) {
    if (!statusText) return 'created';
    const s = statusText.toLowerCase();

    // 1. Kiểm tra Hải quan / Thông quan TRƯỚC (QUAN TRỌNG: tránh "Hoàn tất thủ tục thông quan" bị rơi vào hoàn tất/delivered)
    if (s.includes('hải quan') || s.includes('customs') || s.includes('thông quan')) {
        return 'customs';
    }

    // 2. Giao hàng / Phát hàng
    if (s.includes('phát hàng') || s.includes('out for delivery') || s.includes('đang giao')) {
        return 'out_for_delivery';
    }
    if (s.includes('thành công') || s.includes('delivered') || s.includes('đã giao')) {
        return 'delivered';
    }

    // 3. Vận chuyển / Trung chuyển
    if (s.includes('vận chuyển') || s.includes('transit') || s.includes('departed') || s.includes('arrived') || s.includes('bay') || s.includes('khởi hành') || s.includes('rời kho') || s.includes('quá cảnh')) {
        return 'in_transit';
    }
    if (s.includes('chậm') || s.includes('delay') || s.includes('exception') || s.includes('lỗi') || s.includes('giữ')) {
        return 'exception';
    }
    return 'created';
}

/**
 * Sinh liên kết tra cứu chính thức của hãng vận chuyển nếu có
 */
function getCarrierOfficialUrl(carrierName, subTracking, code) {
    if (!carrierName) return null;
    const trackingRef = (subTracking && subTracking.trim() !== '') ? subTracking.trim() : (code || '').trim();
    if (!trackingRef) return null;

    const carrier = carrierName.toUpperCase();

    if (carrier.includes('DHL')) {
        return `https://www.dhl.com/vn-vi/home/tracking.html?tracking-id=${encodeURIComponent(trackingRef)}`;
    }
    if (carrier.includes('FEDEX')) {
        return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(trackingRef)}`;
    }
    if (carrier.includes('UPS')) {
        return `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingRef)}`;
    }
    if (carrier.includes('CANPAR')) {
        return `https://www.canpar.com/en/track/tracking.jsp?track_number=${encodeURIComponent(trackingRef)}`;
    }
    if (carrier.includes('TOLL')) {
        return `https://www.mytoll.com/#/tracking?number=${encodeURIComponent(trackingRef)}`;
    }
    if (carrier.includes('DPD')) {
        return `https://www.dpd.com/tracking?parcel=${encodeURIComponent(trackingRef)}`;
    }
    if (carrier.includes('CADPOST') || carrier.includes('CANADA POST')) {
        return `https://www.canadapost-postescanada.ca/track-reperage/en#/result_list?searchFor=${encodeURIComponent(trackingRef)}`;
    }
    if (carrier.includes('AUSPOST') || carrier.includes('AUSTRALIA POST')) {
        return `https://auspost.com.au/mypost/track/#/details/${encodeURIComponent(trackingRef)}`;
    }
    if (carrier.includes('VNPOST')) {
        return `https://www.vnpost.vn/vi-vn/dinh-vi/buu-pham?key=${encodeURIComponent(trackingRef)}`;
    }

    return null;
}

/**
 * Sao chép văn bản vào Clipboard kèm phản hồi trực quan
 */
function copyToClipboard(text, triggerBtn, successText = 'Đã chép!') {
    if (!text || text === '---') return;

    const performFeedback = () => {
        triggerBtn.classList.add('copied');
        const originalHtml = triggerBtn.innerHTML;
        triggerBtn.innerHTML = `<i class="fas fa-check"></i> <span>${successText}</span>`;
        setTimeout(() => {
            triggerBtn.classList.remove('copied');
            triggerBtn.innerHTML = originalHtml;
        }, 2200);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(performFeedback).catch(() => {
            fallbackCopy(text, performFeedback);
        });
    } else {
        fallbackCopy(text, performFeedback);
    }
}

function fallbackCopy(text, callback) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        document.execCommand('copy');
        callback();
    } catch (e) {
        console.error('Không thể sao chép:', e);
    }
    document.body.removeChild(textarea);
}

/* =========================================
   UI STATE CONTROLLERS
   ========================================= */

function showSearchState() {
    searchSection.classList.remove('hidden');
    resultsPageWrapper.classList.add('hidden');
    partnersFooter.classList.remove('hidden');
    errorMessageLanding.classList.add('hidden');
    if (trackingFormHeader) trackingFormHeader.classList.add('header-search-hidden');
    mainContainer.style.justifyContent = 'center';
}

function showSkeletonState() {
    searchSection.classList.add('hidden');
    partnersFooter.classList.add('hidden');
    resultsPageWrapper.classList.remove('hidden');
    if (trackingFormHeader) trackingFormHeader.classList.remove('header-search-hidden');

    document.getElementById('skeleton-layout').classList.remove('hidden');
    if (skeletonLoader) skeletonLoader.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');

    mainContainer.style.justifyContent = 'flex-start';
}

function showResultState() {
    if (skeletonLoader) skeletonLoader.classList.add('hidden');
    document.getElementById('skeleton-layout').classList.add('hidden');
    resultContainer.classList.remove('hidden');
    errorContainer.classList.add('hidden');
    partnersFooter.classList.remove('hidden');
    if (trackingFormHeader) trackingFormHeader.classList.remove('header-search-hidden');
}

function showErrorState(message) {
    if (skeletonLoader) skeletonLoader.classList.add('hidden');
    document.getElementById('skeleton-layout').classList.add('hidden');
    resultContainer.classList.add('hidden');
    partnersFooter.classList.remove('hidden');
    if (trackingFormHeader) trackingFormHeader.classList.remove('header-search-hidden');

    errorMessageResults.textContent = message || (currentLang === 'en' ? 'Shipment information not found. Please verify your tracking number.' : 'Không tìm thấy thông tin vận đơn này. Vui lòng kiểm tra lại mã.');
    errorContainer.classList.remove('hidden');
}

/* =========================================
   UPDATE STEPPER PROGRESS
   ========================================= */

function updateLogisticsStepper(category, explicitStep = null) {
    const stepNodes = [
        document.getElementById('step-node-1'),
        document.getElementById('step-node-2'),
        document.getElementById('step-node-3'),
        document.getElementById('step-node-4')
    ];
    const stepLines = [
        document.getElementById('step-line-1'),
        document.getElementById('step-line-2'),
        document.getElementById('step-line-3')
    ];
    const progressFill = document.getElementById('status-progress-fill');

    stepNodes.forEach(n => {
        if (n) n.classList.remove('active', 'completed', 'current');
    });
    stepLines.forEach(l => {
        if (l) l.classList.remove('active');
    });

    let currentLevel = 1;
    if (explicitStep && Number(explicitStep) >= 1 && Number(explicitStep) <= 4) {
        currentLevel = Number(explicitStep);
    } else {
        if (category === 'delivered') currentLevel = 4;
        else if (category === 'out_for_delivery') currentLevel = 4;
        else if (category === 'customs') currentLevel = 3;
        else if (category === 'in_transit') currentLevel = 2;
        else if (category === 'exception') currentLevel = 2;
        else currentLevel = 1;
    }

    for (let i = 0; i < currentLevel; i++) {
        if (stepNodes[i]) {
            if (i < currentLevel - 1 || (currentLevel === 4 && category === 'delivered')) {
                stepNodes[i].classList.add('completed');
            } else {
                stepNodes[i].classList.add('current');
            }
        }
        if (i < currentLevel - 1 && stepLines[i]) {
            stepLines[i].classList.add('active');
        }
    }

    if (progressFill) {
        if (category === 'delivered') {
            progressFill.style.width = '100%';
            progressFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
        } else if (category === 'exception') {
            progressFill.style.width = '50%';
            progressFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
        } else {
            const pct = Math.min(100, Math.max(25, currentLevel * 25));
            progressFill.style.width = `${pct}%`;
            progressFill.style.background = 'linear-gradient(90deg, var(--primary-dark), var(--primary), #ffd54f)';
        }
    }
}

/* =========================================
   POPULATE RESULTS DATA
   ========================================= */

function populateResults(data) {
    if (!data) return;

    // 1. Phân tích trạng thái mới nhất
    let latestStatusObj = { status: "Đã tiếp nhận thông tin vận đơn", date: data.createdAt };
    let hasHistory = false;

    if (data.history && Array.isArray(data.history) && data.history.length > 0) {
        hasHistory = true;
        const sortedHistory = [...data.history].sort((a, b) => new Date(b.date) - new Date(a.date));
        latestStatusObj = sortedHistory[0];
    }

    const normalizedLatestStatus = normalizeCarrierStatus(latestStatusObj.status);
    const category = getStatusCategory(normalizedLatestStatus);

    // 2. Banner chính
    const statusTextEl = document.getElementById('status-text');
    const statusDateEl = document.getElementById('status-date');
    const mainTrackingCodeEl = document.getElementById('main-tracking-code');
    const statusBadgeBox = document.getElementById('status-badge-box');

    if (statusTextEl) statusTextEl.textContent = normalizedLatestStatus;
    if (statusDateEl) statusDateEl.textContent = formatDateTime(latestStatusObj.date);
    if (mainTrackingCodeEl) mainTrackingCodeEl.textContent = data.code || '---';

    // Cập nhật màu sắc theo category
    if (statusBadgeBox) {
        statusBadgeBox.className = `status-badge-container badge-${category}`;
    }

    updateLogisticsStepper(category, data.currentStep);

    // 3. Nút copy mã vận đơn chính
    const btnCopyMain = document.getElementById('btn-copy-main-code');
    if (btnCopyMain) {
        btnCopyMain.onclick = () => {
            copyToClipboard(data.code, btnCopyMain, 'Đã sao chép');
        };
    }

    // 4. Thông tin lô hàng (Shipment Info)
    const fromEl = document.getElementById('info-from');
    const toEl = document.getElementById('info-to');
    const sendDateEl = document.getElementById('info-send-date');
    const carrierEl = document.getElementById('info-carrier');
    const subTrackingEl = document.getElementById('info-sub-tracking');
    const carrierOfficialLink = document.getElementById('carrier-official-link');
    const btnCopySub = document.getElementById('btn-copy-sub');

    if (fromEl) fromEl.textContent = sanitizeText(data.fromCountry, 'Việt Nam');
    if (toEl) toEl.textContent = sanitizeText(data.toCountry, 'Chưa xác định');

    if (sendDateEl) {
        try {
            const sendDate = data.createdAt ? new Date(data.createdAt) : null;
            sendDateEl.textContent = (sendDate && !isNaN(sendDate.getTime()))
                ? sendDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : 'Chưa có thông tin';
        } catch (e) {
            sendDateEl.textContent = 'Chưa có thông tin';
        }
    }

    const carrierVal = sanitizeText(data.carrier, 'EXIMLOG Logistics');
    if (carrierEl) carrierEl.textContent = carrierVal;

    const subTrackingVal = sanitizeText(data.subTracking, '');
    if (subTrackingEl) {
        if (subTrackingVal) {
            subTrackingEl.textContent = subTrackingVal;
            if (btnCopySub) {
                btnCopySub.classList.remove('hidden');
                btnCopySub.onclick = () => {
                    copyToClipboard(subTrackingVal, btnCopySub, 'Đã sao chép');
                };
            }
        } else {
            subTrackingEl.textContent = 'Không áp dụng';
            subTrackingEl.classList.add('text-muted');
            if (btnCopySub) btnCopySub.classList.add('hidden');
        }
    }

    // Liên kết website chính thức của hãng
    if (carrierOfficialLink) {
        const officialUrl = getCarrierOfficialUrl(data.carrier, data.subTracking, data.code);
        if (officialUrl) {
            carrierOfficialLink.href = officialUrl;
            carrierOfficialLink.classList.remove('hidden');
        } else {
            carrierOfficialLink.classList.add('hidden');
            carrierOfficialLink.removeAttribute('href');
        }
    }

    // 5. Chi tiết dịch vụ & quy cách
    const serviceTypeEl = document.getElementById('service-type');
    const serviceTermEl = document.getElementById('service-term');
    const packagingEl = document.getElementById('detail-packaging');
    const piecesEl = document.getElementById('detail-pieces');
    const weightEl = document.getElementById('detail-weight');

    if (serviceTypeEl) serviceTypeEl.textContent = sanitizeText(data.serviceType, 'Chuyển phát Tiêu chuẩn (Standard)');
    if (serviceTermEl) serviceTermEl.textContent = 'Standard Air Cargo';
    if (packagingEl) packagingEl.textContent = sanitizeText(data.packaging, 'Thùng carton');

    if (piecesEl) {
        const pkgs = Number(data.packages);
        piecesEl.textContent = (!isNaN(pkgs) && pkgs > 0) ? `${pkgs} Kiện` : '1 Kiện';
    }

    if (weightEl) {
        const w = Number(data.weight);
        weightEl.textContent = (!isNaN(w) && w > 0) ? `${w.toLocaleString('vi-VN')} Kg` : 'Chưa cân';
    }

    // 6. Timeline Hành trình (Grouping by Date, Collapsible)
    renderTimelineHistory(data);
}

/**
 * Hiển thị Timeline sự kiện chuyên nghiệp:
 * - Sắp xếp mới nhất ở đầu
 * - Nhóm theo ngày (Date headers)
 * - Định dạng giờ chính xác GMT+7
 * - Cho phép xem toàn bộ lịch sử và thu gọn
 * - Tuyệt đối không tạo dữ liệu tracking giả
 */
function renderTimelineHistory(data) {
    const historyList = document.getElementById('history-list');
    const historyCountBadge = document.getElementById('history-count-badge');
    const timelineToggleWrapper = document.getElementById('timeline-toggle-wrapper');
    const btnToggleHistory = document.getElementById('btn-toggle-history');
    const toggleHistoryText = document.getElementById('toggle-history-text');
    const toggleHistoryIcon = document.getElementById('toggle-history-icon');

    if (!historyList) return;
    historyList.innerHTML = '';
    isTimelineExpanded = false;

    if (!data.history || !Array.isArray(data.history) || data.history.length === 0) {
        if (historyCountBadge) historyCountBadge.textContent = '0 sự kiện';
        if (timelineToggleWrapper) timelineToggleWrapper.classList.add('hidden');

        historyList.innerHTML = `
            <li class="timeline-empty-item">
                <div class="empty-icon-wrap"><i class="fas fa-boxes-packing"></i></div>
                <div class="empty-text-wrap">
                    <strong>Đơn hàng đang chờ cập nhật hành trình chi tiết</strong>
                    <p>Hệ thống sẽ đồng bộ tự động ngay khi bưu kiện được quét tại trạm trung chuyển tiếp theo.</p>
                </div>
            </li>
        `;
        return;
    }

    // Sắp xếp mới nhất ở đầu
    const sortedHistory = [...data.history].sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalEvents = sortedHistory.length;

    if (historyCountBadge) {
        historyCountBadge.textContent = `${totalEvents} sự kiện`;
    }

    // Nhóm theo ngày (YYYY-MM-DD)
    const groups = [];
    const dateMap = new Map();

    sortedHistory.forEach((entry, index) => {
        const d = new Date(entry.date);
        const dateKey = !isNaN(d.getTime())
            ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            : 'unknown';

        if (!dateMap.has(dateKey)) {
            const groupObj = {
                dateKey,
                dateObj: d,
                entries: []
            };
            dateMap.set(dateKey, groupObj);
            groups.push(groupObj);
        }
        dateMap.get(dateKey).entries.push({ entry, globalIndex: index });
    });

    const COLLAPSE_THRESHOLD = 4;
    const needsCollapse = totalEvents > COLLAPSE_THRESHOLD;

    groups.forEach((group) => {
        // Nhóm Date Header
        const dateHeaderLi = document.createElement('li');
        dateHeaderLi.className = 'timeline-date-group-header';
        dateHeaderLi.innerHTML = `
            <span class="date-group-pill">
                <i class="far fa-calendar-days"></i> ${escapeHTML(formatDateHeader(group.dateObj))}
            </span>
        `;
        historyList.appendChild(dateHeaderLi);

        // Các sự kiện trong ngày
        group.entries.forEach(({ entry, globalIndex }) => {
            const dateObj = new Date(entry.date);
            const timeStr = !isNaN(dateObj.getTime())
                ? dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : '--:--';

            // Xử lý vị trí địa lý thực tế
            let locationDisplay = '';
            const isFirstCreatedStatus = (globalIndex === totalEvents - 1);

            if (entry.location && entry.location.trim() !== '') {
                locationDisplay = entry.location.trim();
            } else if (isFirstCreatedStatus) {
                locationDisplay = data.fromCountry || 'Ho Chi Minh, VN';
            } else {
                locationDisplay = data.toCountry || 'Đang vận chuyển';
            }

            const normalizedStatus = normalizeCarrierStatus(entry.status);
            const itemCategory = getStatusCategory(normalizedStatus);
            const statusDisplay = (normalizedStatus || '').toUpperCase();
            const isLatest = (globalIndex === 0);

            const li = document.createElement('li');
            li.className = `timeline-item ${isLatest ? 'is-latest' : ''} ${globalIndex >= COLLAPSE_THRESHOLD ? 'history-collapsible-item' : ''}`;
            li.setAttribute('data-index', globalIndex);

            li.innerHTML = `
                <div class="time-col">
                    <span class="time-part">${timeStr}</span>
                    <span class="tz-part">GMT+7</span>
                </div>
                <div class="dot ${isLatest ? 'pulse-dot' : ''}">
                    ${isLatest ? '<span class="dot-inner"></span>' : ''}
                </div>
                <div class="content-col">
                    <div class="content-header">
                        <span class="status-name category-${itemCategory}">${escapeHTML(statusDisplay)}</span>
                    </div>
                    <div class="content-meta">
                        <span class="location-badge">
                            <i class="fas fa-location-dot"></i> ${escapeHTML(locationDisplay)}
                        </span>
                        ${entry.description ? `<p class="event-desc">${escapeHTML(entry.description)}</p>` : ''}
                    </div>
                </div>
            `;

            historyList.appendChild(li);
        });
    });

    // Cấu hình nút xem thêm / thu gọn
    if (timelineToggleWrapper && btnToggleHistory) {
        if (needsCollapse) {
            timelineToggleWrapper.classList.remove('hidden');
            const hiddenCount = totalEvents - COLLAPSE_THRESHOLD;
            toggleHistoryText.textContent = `Xem toàn bộ lịch sử (${totalEvents} sự kiện)`;
            toggleHistoryIcon.className = 'fas fa-chevron-down';

            // Ẩn các phần tử vượt ngưỡng
            const collapsibleItems = historyList.querySelectorAll('.history-collapsible-item');
            collapsibleItems.forEach(el => el.classList.add('collapsed'));

            btnToggleHistory.onclick = () => {
                isTimelineExpanded = !isTimelineExpanded;
                btnToggleHistory.setAttribute('aria-expanded', isTimelineExpanded);

                collapsibleItems.forEach(el => {
                    if (isTimelineExpanded) {
                        el.classList.remove('collapsed');
                    } else {
                        el.classList.add('collapsed');
                    }
                });

                if (isTimelineExpanded) {
                    toggleHistoryText.textContent = 'Thu gọn lịch sử cũ';
                    toggleHistoryIcon.className = 'fas fa-chevron-up';
                } else {
                    toggleHistoryText.textContent = `Xem toàn bộ lịch sử (${totalEvents} sự kiện)`;
                    toggleHistoryIcon.className = 'fas fa-chevron-down';
                }
            };
        } else {
            timelineToggleWrapper.classList.add('hidden');
        }
    }
}

/* =========================================
   SEARCH HANDLER (Supports single & comma-separated codes)
   ========================================= */

async function handleSearch(code) {
    if (!code) {
        showSearchState();
        errorMessageLanding.textContent = currentLang === 'en' ? 'Please enter a tracking number to search.' : 'Vui lòng nhập mã vận đơn để tra cứu.';
        errorMessageLanding.classList.remove('hidden');
        return;
    }

    // Support comma/semicolon/space separated multiple tracking codes
    const rawCodes = code.split(/[,;\s]+/).map(c => c.trim()).filter(Boolean);
    const cleanCode = rawCodes[0] || code.trim();

    // Cập nhật URL trình duyệt
    const newUrl = `${window.location.pathname}?code=${encodeURIComponent(cleanCode)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    errorMessageLanding.classList.add('hidden');

    // Chuyển sang màn hình Skeleton Loading
    showSkeletonState();

    // Đồng bộ giá trị input ở cả landing và header
    trackingCodeInputLanding.value = cleanCode;
    trackingCodeInputHeader.value = cleanCode;

    setTimeout(async () => {
        try {
            const res = await fetch(`${API_URL}?code=${encodeURIComponent(cleanCode)}`);

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || (currentLang === 'en' ? 'Tracking number does not exist or has not been synced to the system.' : 'Mã vận đơn không tồn tại hoặc chưa được đồng bộ lên hệ thống.'));
            }
            const data = await res.json();

            populateResults(data);
            showResultState();

        } catch (err) {
            showErrorState(err.message || (currentLang === 'en' ? 'Tracking details not found.' : 'Không tìm thấy thông tin mã vận đơn.'));
        }
    }, 550);
}

/* =========================================
   MULTI-LANGUAGE (i18n) SYSTEM
   ========================================= */

const translations = {
    vi: {
        home: "Trang chủ",
        login: "Đăng nhập",
        trackTitle: "Theo Dõi Kiện Hàng Của Bạn",
        trackSubtitle: "Nhập mã vận đơn EximLog hoặc mã hãng vận chuyển để theo dõi hành trình hàng hóa tức thì.",
        placeholder: "Nhập mã theo dõi của bạn (có thể nhập nhiều mã, cách nhau bởi dấu phẩy)",
        headerPlaceholder: "Nhập mã vận đơn khác...",
        btnTrack: "Theo dõi",
        sampleCodes: "Mã mẫu tra cứu:",
        copy: "Sao chép",
        lastUpdated: "Cập nhật lần cuối:",
        stepReceived: "Tiếp nhận",
        stepInTransit: "Vận chuyển",
        stepCustoms: "Thông quan",
        stepDelivered: "Giao thành công",
        journeyHistory: "LỊCH SỬ HÀNH TRÌNH",
        viewAllHistory: "Xem toàn bộ lịch sử",
        shipmentInfo: "THÔNG TIN LÔ HÀNG",
        origin: "NƠI GỬI (ORIGIN)",
        dest: "NƠI ĐẾN (DESTINATION)",
        carrier: "Hãng vận chuyển",
        officialWeb: "Web hãng",
        sendDate: "Ngày gửi hàng",
        subTracking: "Mã theo dõi hãng (Sub-tracking)",
        serviceDetails: "CHI TIẾT DỊCH VỤ & QUY CÁCH",
        service: "Dịch vụ",
        packaging: "Loại đóng gói",
        pieces: "Số lượng kiện",
        weight: "Trọng lượng",
        helpTitle: "Cần trợ giúp về lô hàng này?",
        helpSubtitle: "Đội ngũ chuyên viên vận tải EximLog hỗ trợ 24/7",
        btnPrint: "In phiếu",
        btnHelp: "Hỗ trợ ngay",
        notFoundTitle: "Không tìm thấy thông tin vận đơn",
        tryAgain: "Thử tra cứu lại",
        backHome: "Về trang tra cứu",
        globalPartners: "ĐỐI TÁC VẬN CHUYỂN TOÀN CẦU"
    },
    en: {
        home: "Home",
        login: "Login",
        trackTitle: "Track Your Shipment",
        trackSubtitle: "Enter your EximLog tracking number or carrier code to track shipments instantly.",
        placeholder: "Enter your tracking number(s), separated by commas",
        headerPlaceholder: "Enter another tracking number...",
        btnTrack: "Track",
        sampleCodes: "Sample Tracking IDs:",
        copy: "Copy",
        lastUpdated: "Last updated:",
        stepReceived: "Received",
        stepInTransit: "In Transit",
        stepCustoms: "Customs Clearance",
        stepDelivered: "Delivered Successfully",
        journeyHistory: "SHIPMENT TRAVEL HISTORY",
        viewAllHistory: "View full history",
        shipmentInfo: "SHIPMENT INFORMATION",
        origin: "ORIGIN",
        dest: "DESTINATION",
        carrier: "Carrier",
        officialWeb: "Carrier Site",
        sendDate: "Ship Date",
        subTracking: "Carrier Tracking No.",
        serviceDetails: "SERVICE & SPECIFICATIONS",
        service: "Service",
        packaging: "Packaging",
        pieces: "Pieces",
        weight: "Weight",
        helpTitle: "Need help with this shipment?",
        helpSubtitle: "EximLog Logistics specialists are available 24/7",
        btnPrint: "Print Slip",
        btnHelp: "Support Now",
        notFoundTitle: "Shipment Not Found",
        tryAgain: "Try Again",
        backHome: "Back to Search",
        globalPartners: "GLOBAL LOGISTICS PARTNERS"
    }
};

let currentLang = localStorage.getItem('eximlog_lang') || 'vi';

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('eximlog_lang', lang);

    // Update text elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Update placeholders
    const trackingInput = document.getElementById('trackingCodeInput');
    if (trackingInput && translations[lang].placeholder) {
        trackingInput.placeholder = translations[lang].placeholder;
    }
    const trackingInputHeader = document.getElementById('trackingCodeInputHeader');
    if (trackingInputHeader && translations[lang].headerPlaceholder) {
        trackingInputHeader.placeholder = translations[lang].headerPlaceholder;
    }

    // Update language button display with crisp SVGs
    const flagViSVG = `<svg width="18" height="18" viewBox="0 0 20 20" class="flag-svg" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#da251d"/><polygon points="10,4.5 11.5,8.8 16,8.8 12.3,11.5 13.7,15.8 10,13.1 6.3,15.8 7.7,11.5 4,8.8 8.5,8.8" fill="#ffff00"/></svg>`;
    const flagEnSVG = `<svg width="18" height="18" viewBox="0 0 20 20" class="flag-svg" aria-hidden="true"><clipPath id="circleUK"><circle cx="10" cy="10" r="10"/></clipPath><g clip-path="url(#circleUK)"><rect width="20" height="20" fill="#012169"/><path d="M0,0 L20,20 M20,0 L0,20" stroke="#fff" stroke-width="3"/><path d="M0,0 L20,20 M20,0 L0,20" stroke="#c8102e" stroke-width="1.8"/><path d="M10,0 V20 M0,10 H20" stroke="#fff" stroke-width="5"/><path d="M10,0 V20 M0,10 H20" stroke="#c8102e" stroke-width="3"/></g></svg>`;

    const currentLangFlag = document.getElementById('currentLangFlag');
    const currentLangText = document.getElementById('currentLangText');
    if (currentLangFlag) currentLangFlag.innerHTML = (lang === 'vi') ? flagViSVG : flagEnSVG;
    if (currentLangText) currentLangText.textContent = (lang === 'vi') ? 'Tiếng Việt' : 'English';

    // Update active state in dropdown
    document.querySelectorAll('.lang-option').forEach(opt => {
        if (opt.getAttribute('data-lang') === lang) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
}

// Dropdown interactions
const langDropdown = document.getElementById('langDropdown');
const btnLangToggle = document.getElementById('btnLangToggle');
const langMenu = document.getElementById('langMenu');

if (btnLangToggle && langMenu) {
    btnLangToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = langMenu.classList.contains('hidden');
        langMenu.classList.toggle('hidden');
        if (langDropdown) langDropdown.classList.toggle('active', willOpen);
        btnLangToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const lang = btn.getAttribute('data-lang');
            setLanguage(lang);
            langMenu.classList.add('hidden');
            if (langDropdown) langDropdown.classList.remove('active');
            btnLangToggle.setAttribute('aria-expanded', 'false');
        });
    });

    document.addEventListener('click', (e) => {
        if (langDropdown && !langDropdown.contains(e.target)) {
            langMenu.classList.add('hidden');
            langDropdown.classList.remove('active');
            btnLangToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

/* =========================================
   EVENT LISTENERS
   ========================================= */

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

// Click vào các mẫu chip ví dụ ở landing
document.querySelectorAll('.sample-code-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const code = chip.getAttribute('data-code');
        if (code) {
            trackingCodeInputLanding.value = code;
            handleSearch(code);
        }
    });
});

// Load từ URL params ban đầu & Khởi tạo ngôn ngữ
document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);

    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');

    if (codeFromUrl) {
        handleSearch(codeFromUrl);
    } else {
        showSearchState();
    }
});

/* =========================================
   PARTNER CAROUSEL LOGIC
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.carousel-item');
    if (!items.length) return;

    let currentIndex = 0;
    const totalItems = items.length;

    function updateCarousel() {
        items.forEach(item => {
            item.classList.remove('active', 'prev', 'next');
        });

        const activeIndex = currentIndex;

        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = totalItems - 1;

        let nextIndex = currentIndex + 1;
        if (nextIndex >= totalItems) nextIndex = 0;

        items[activeIndex].classList.add('active');
        items[prevIndex].classList.add('prev');
        items[nextIndex].classList.add('next');

        currentIndex++;
        if (currentIndex >= totalItems) currentIndex = 0;
    }

    updateCarousel();
    setInterval(updateCarousel, 2200);
});

/**
 * In phiếu thông tin vận đơn chuyên nghiệp / Lưu file PDF
 */
function printTrackingSlip() {
    // 1. Cập nhật thời gian in chính xác
    const printTimeEl = document.getElementById('print-timestamp');
    if (printTimeEl) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        printTimeEl.textContent = `In lúc: ${timeStr}, ${dateStr}`;
    }

    // 2. Mở rộng toàn bộ lịch sử để trang in hiển thị trọn vẹn
    const collapsedItems = document.querySelectorAll('.history-collapsible-item.collapsed');
    collapsedItems.forEach(el => el.classList.remove('collapsed'));

    // 3. Kích hoạt hộp thoại in / Xuất PDF của trình duyệt
    window.print();
}