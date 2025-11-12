document.addEventListener('DOMContentLoaded', () => {

    // --- XỬ LÝ NÚT BACK TO TOP ---
    const backToTopButton = document.getElementById('backToTopBtn');
    if (backToTopButton) {
        // Hiển thị nút khi người dùng cuộn xuống
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopButton.style.display = 'flex';
            } else {
                backToTopButton.style.display = 'none';
            }
        });

        // Cuộn lên đầu trang mượt mà khi nhấp
        backToTopButton.addEventListener('click', (event) => {
            event.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // --- XỬ LÝ CUỘN MƯỢT KHI NHẤN MENU (SMOOTH SCROLL) ---
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // --- XỬ LÝ MENU TRÊN DI ĐỘNG ---
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileNavToggle && navMenu) {
        // Khi nhấn nút hamburger
        mobileNavToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Tự động đóng menu khi nhấn vào một mục
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
            });
        });
    }

    // =======================================================
    // --- XỬ LÝ ZALO POPUP (MODAL) ---
    // =======================================================
    const zaloButton = document.getElementById('zaloFabButton');
    const zaloPopup = document.getElementById('zaloPopup'); // Đây là .zalo-popup-overlay
    const zaloCloseButton = document.getElementById('zaloPopupClose');

    if (zaloButton && zaloPopup && zaloCloseButton) {
        
        // Mở popup khi nhấn nút Zalo
        zaloButton.addEventListener('click', (e) => {
            e.preventDefault(); // Ngăn hành vi mặc định (nếu có)
            zaloPopup.classList.add('show');
        });

        // Đóng popup khi nhấn nút 'x'
        zaloCloseButton.addEventListener('click', () => {
            zaloPopup.classList.remove('show');
        });

        // Đóng popup khi nhấn vào backdrop (overlay)
        zaloPopup.addEventListener('click', (e) => {
            // Chỉ đóng nếu click trực tiếp vào overlay (e.target)
            // chứ không phải click vào .zalo-popup-content (phần con)
            if (e.target === zaloPopup) { 
                zaloPopup.classList.remove('show');
            }
        });
    }

    // --- MỚI: SCROLL ANIMATION CHO SERVICE CARDS VÀ FOOTER ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);

    // Observe service cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => observer.observe(card));

    // Observe footer columns (fade-in khi scroll đến)
    const footerColumns = document.querySelectorAll('.footer-column');
    footerColumns.forEach(col => {
        observer.observe(col);
    });

});