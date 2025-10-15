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
            
            // Chỉ xử lý cho các link trỏ đến section (bắt đầu bằng #)
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

});