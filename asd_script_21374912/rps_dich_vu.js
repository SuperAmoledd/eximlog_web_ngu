document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. Mobile Menu & Overlay ---
    const navToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('#navMenu');
    const overlay = document.getElementById('overlay');
    const body = document.body;

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            if (overlay) overlay.classList.toggle('active');
            
            // Đổi icon
            const icon = navToggle.querySelector('i');
            if (icon) {
                if (navMenu.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-xmark');
                    body.style.overflow = 'hidden';
                } else {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                    body.style.overflow = '';
                }
            }
        });

        if (overlay) {
            overlay.addEventListener('click', function() {
                navMenu.classList.remove('active');
                overlay.classList.remove('active');
                body.style.overflow = '';
                const icon = navToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            });
        }
    }

    // --- 2. Xử lý Mục Lục (TOC) - Code mới đã Fix lỗi ---
    const tocHeader = document.querySelector('.toc-header');
    const tocList = document.querySelector('.toc-list');
    const tocToggleBtn = document.querySelector('.toc-toggle');
    
    // Logic ẩn/hiện: Nếu màn hình nhỏ (Mobile/Tablet) thì mặc định ẩn
    if (tocList && window.innerWidth < 992) {
        tocList.style.display = 'none';
        if(tocToggleBtn) tocToggleBtn.innerHTML = '<span class="icon-list">▼</span>';
    }

    function toggleTOC(e) {
        // Ngăn chặn sự kiện click kép nếu bấm trúng nút nằm trong header
        if (e && e.target.closest('.toc-toggle') && e.currentTarget !== e.target.closest('.toc-toggle')) {
            return; 
        }

        if (window.getComputedStyle(tocList).display === 'none') {
            tocList.style.display = 'block';
            if(tocToggleBtn) tocToggleBtn.innerHTML = '<span class="icon-list">☰</span>'; 
        } else {
            tocList.style.display = 'none';
            if(tocToggleBtn) tocToggleBtn.innerHTML = '<span class="icon-list">▼</span>';
        }
    }

    // Gắn sự kiện click vào cả thanh Header của mục lục
    if(tocHeader && tocList) {
        tocHeader.addEventListener('click', toggleTOC);
    }

    // --- 3. Tự động thêm thanh cuộn ngang cho bảng giá ---
    const tables = document.querySelectorAll('.price-table');
    tables.forEach(table => {
        if (!table.parentElement.classList.contains('table-responsive-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive-wrapper';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
});