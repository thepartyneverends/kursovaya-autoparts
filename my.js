document.addEventListener('DOMContentLoaded', function() {
            const addToCartButtons = document.querySelectorAll('.btn-primary');
            const cartCount = document.querySelector('.cart-count');
            let count = parseInt(cartCount.textContent);
            
            addToCartButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Увеличиваем счетчик корзины
                    count++;
                    cartCount.textContent = count;
                    
                    // Анимация кнопки
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="bi bi-check2 me-2"></i>Добавлено';
                    this.classList.remove('btn-primary');
                    this.classList.add('btn-success');
                    
                    // Возвращаем исходное состояние через 2 секунды
                    setTimeout(() => {
                        this.innerHTML = originalText;
                        this.classList.remove('btn-success');
                        this.classList.add('btn-primary');
                    }, 2000);
                });
            });
            
            // Плавная прокрутка к якорям
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    const targetId = this.getAttribute('href');
                    if(targetId === '#') return;
                    
                    const targetElement = document.querySelector(targetId);
                    if(targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 80,
                            behavior: 'smooth'
                        });
                    }
                });
            });
        });