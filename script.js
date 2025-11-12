document.addEventListener('DOMContentLoaded', () => {

    const backToTopButton = document.getElementById('backToTopBtn');
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopButton.style.display = 'flex';
            } else {
                backToTopButton.style.display = 'none';
            }
        });

        backToTopButton.addEventListener('click', (event) => {
            event.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                // e.preventDefault(); // Tạm thời bỏ preventDefault để logic đóng menu bên dưới chạy
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    e.preventDefault(); // Chỉ preventDefault nếu tìm thấy target
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileNavToggle && navMenu) {
        mobileNavToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // === PHẦN ĐÃ SỬA LỖI ===
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                
                // Kiểm tra xem link vừa bấm có phải là cha của dropdown không
                const isDropdownParent = link.parentElement.classList.contains('nav-item-dropdown');

                // Chỉ đóng menu nếu:
                // 1. Chúng ta đang ở màn hình mobile (window.innerWidth <= 992)
                // 2. VÀ link vừa bấm KHÔNG PHẢI là link cha (isDropdownParent === false)
                if (window.innerWidth <= 992 && !isDropdownParent) {
                    if (navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                    }
                }
                
                // Nếu là desktop, hoặc là link cha trên mobile, nó sẽ không làm gì cả
                // (logic accordion ở dưới sẽ xử lý)
            });
        });
        // === KẾT THÚC PHẦN SỬA LỖI ===
    }

    const zaloButton = document.getElementById('zaloFabButton');
    const zaloPopup = document.getElementById('zaloPopup'); 
    const zaloCloseButton = document.getElementById('zaloPopupClose');

    if (zaloButton && zaloPopup && zaloCloseButton) {
        
        zaloButton.addEventListener('click', (e) => {
            e.preventDefault(); 
            zaloPopup.classList.add('show');
        });

        zaloCloseButton.addEventListener('click', () => {
            zaloPopup.classList.remove('show');
        });

        zaloPopup.addEventListener('click', (e) => {
            if (e.target === zaloPopup) { 
                zaloPopup.classList.remove('show');
            }
        });
    }

    // Logic cho accordion (mở menu con)
    const dropdownLinks = document.querySelectorAll('.nav-menu .nav-item-dropdown > a');

    dropdownLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Chỉ chạy logic này trên màn hình mobile (khi nút hamburger hiển thị)
            if (window.innerWidth <= 992) {
                e.preventDefault(); // Ngăn không cho click nhảy trang ngay lập tức
                
                // Lấy menu con (là thẻ <ul> ngay sau thẻ <a> này)
                const subMenu = this.nextElementSibling;

                // Toggle lớp active cho link (để xoay icon)
                this.classList.toggle('submenu-active-link');
                
                // Toggle lớp active cho menu con (để xổ nó ra)
                if (subMenu) {
                    subMenu.classList.toggle('submenu-active');
                }
            }
            // Trên desktop (width > 992), event listener này không làm gì cả
            // và link sẽ hoạt động bình thường (hover CSS và click để điều hướng)
        });
    });

    // Logic cho animation
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

    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => observer.observe(card));

    const footerColumns = document.querySelectorAll('.footer-column');
    footerColumns.forEach(col => {
        observer.observe(col);
    });

});