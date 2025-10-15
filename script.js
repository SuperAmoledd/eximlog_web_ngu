document.addEventListener('DOMContentLoaded', () => {

    const backToTopButton = document.getElementById('backToTopBtn');

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

    // Xử lý cuộn mượt khi nhấn vào menu
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

    // =======================================================
    // --- MÃ MỚI: XỬ LÝ MENU TRÊN DI ĐỘNG ---
    // =======================================================
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

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

});