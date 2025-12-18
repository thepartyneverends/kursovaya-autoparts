// Класс для работы с товарами и каруселью
class CarouselProductService {
    constructor() {
        this.products = [];
        this.cart = this.loadCart();
    }

    // Загрузка данных из JSON
    async loadProducts() {
        try {
            const response = await fetch('data/products.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.products = data.products;
            console.log('Данные успешно загружены:', this.products.length, 'товаров');
            return this.products;
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            return this.getFallbackData();
        }
    }

    // Получить товары для карусели
    getCarouselProducts() {
        return this.products.filter(product => product.carousel === true);
    }

    // Группировать товары по слайдам
    groupProductsForCarousel(productsPerSlide = 4) {
        const carouselProducts = this.getCarouselProducts();
        const groups = [];
        
        // Сортируем по carouselIndex
        carouselProducts.sort((a, b) => (a.carouselIndex || 0) - (b.carouselIndex || 0));
        
        // Группируем по productsPerSlide товаров на слайд
        for (let i = 0; i < carouselProducts.length; i += productsPerSlide) {
            groups.push(carouselProducts.slice(i, i + productsPerSlide));
        }
        
        return groups;
    }

    // Получить товары для конкретного слайда
    getProductsForSlide(slideIndex, productsPerSlide = 4) {
        const groups = this.groupProductsForCarousel(productsPerSlide);
        return groups[slideIndex] || [];
    }

    // Получить общее количество слайдов
    getTotalSlides(productsPerSlide = 4) {
        return Math.ceil(this.getCarouselProducts().length / productsPerSlide);
    }

    // Поиск товара по ID
    getProductById(id) {
        return this.products.find(product => product.id === parseInt(id));
    }

    // Работа с корзиной
    loadCart() {
        const cartJson = localStorage.getItem('autoparts_cart');
        return cartJson ? JSON.parse(cartJson) : [];
    }

    saveCart() {
        localStorage.setItem('autoparts_cart', JSON.stringify(this.cart));
    }

    addToCart(productId, quantity = 1) {
        const product = this.getProductById(productId);
        if (!product) return false;

        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }
        
        this.saveCart();
        this.updateCartCounter();
        return true;
    }

    updateCartCounter() {
        const cartCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const counterElement = document.querySelector('.cart-count');
        if (counterElement) {
            counterElement.textContent = cartCount;
        }
    }
}

// Класс для рендеринга карусели
class CarouselRenderer {
    constructor(productService) {
        this.productService = productService;
        this.currentSlide = 0;
        this.productsPerSlide = 4;
    }

    // Форматирование цены
    formatPrice(price) {
        if (!price) return '0';
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    // Генерация HTML для карточки товара
    generateProductCard(product) {
        return `
            <div class="col-md-6 col-lg-3">
                <div class="product-card card h-100">
                    <div class="position-relative">
                        ${product.badge ? `<span class="badge bg-danger badge-discount">${product.badge}</span>` : ''}
                        <img src="${product.image}" class="card-img-top product-img" alt="${product.name}" 
                             onerror="this.src='https://via.placeholder.com/300x200/6c757d/ffffff?text=Нет+изображения'">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text text-muted small">${product.description}</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <span class="price">${this.formatPrice(product.price)} ₽</span>
                                    ${product.oldPrice ? `<span class="old-price ms-2">${this.formatPrice(product.oldPrice)} ₽</span>` : ''}
                                </div>
                            </div>
                            <div class="d-grid">
                            <a href="all-parts.html">
                                <button class="btn btn-primary add-to-cart-btn">
                                    <i class="bi bi-cart-plus me-2"></i>
                                    Купить
                                </button></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Генерация HTML для слайда
    generateSlide(slideIndex, products) {
        return `
            <div class="carousel-item ${slideIndex === 0 ? 'active' : ''}">
                <div class="row g-4 justify-content-center">
                    ${products.map(product => this.generateProductCard(product)).join('')}
                </div>
            </div>
        `;
    }

    // Генерация индикаторов
    generateIndicators(totalSlides) {
        let indicatorsHtml = '';
        for (let i = 0; i < totalSlides; i++) {
            indicatorsHtml += `
                <button type="button" data-bs-target="#productsCarousel" 
                        data-bs-slide-to="${i}" 
                        class="${i === 0 ? 'active' : ''}"
                        aria-label="Slide ${i + 1}"></button>
            `;
        }
        return indicatorsHtml;
    }

    // Рендеринг всей карусели
    renderCarousel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const totalSlides = this.productService.getTotalSlides(this.productsPerSlide);
        
        if (totalSlides === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-exclamation-triangle display-1 text-warning mb-3"></i>
                    <h4>Нет товаров для отображения</h4>
                </div>
            `;
            return;
        }

        let carouselHtml = `
            <div id="productsCarousel" class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-indicators">
                    ${this.generateIndicators(totalSlides)}
                </div>
                
                <div class="carousel-inner">
        `;

        // Генерируем слайды
        for (let i = 0; i < totalSlides; i++) {
            const products = this.productService.getProductsForSlide(i, this.productsPerSlide);
            carouselHtml += this.generateSlide(i, products);
        }

        carouselHtml += `
                </div>
                
                <button class="carousel-control-prev carousel-control-custom" type="button" 
                        data-bs-target="#productsCarousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Предыдущий</span>
                </button>
                <button class="carousel-control-next carousel-control-custom" type="button" 
                        data-bs-target="#productsCarousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Следующий</span>
                </button>
            </div>
        `;

        container.innerHTML = carouselHtml;
        
        // Инициализируем обработчики событий
        this.attachEventListeners();
        
        // Обновляем статистику
        this.updateStats();
    }

    // Прикрепление обработчиков событий
    attachEventListeners() {
        // Обработчики для кнопок корзины
        setTimeout(() => {
            document.querySelectorAll('.add-to-cart-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const productId = e.currentTarget.getAttribute('data-product-id');
                    const added = this.productService.addToCart(productId);
                    
                    if (added) {
                        // Визуальная обратная связь
                        const btn = e.currentTarget;
                        const originalText = btn.innerHTML;
                        btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Добавлено';
                        btn.classList.remove('btn-primary');
                        btn.classList.add('btn-success');
                        btn.disabled = true;
                        
                        setTimeout(() => {
                            btn.innerHTML = originalText;
                            btn.classList.remove('btn-success');
                            btn.classList.add('btn-primary');
                            btn.disabled = false;
                        }, 1500);
                    }
                });
            });

            // Пауза карусели при наведении
            const carousel = document.getElementById('productsCarousel');
            if (carousel) {
                const bsCarousel = new bootstrap.Carousel(carousel);
                
                carousel.addEventListener('mouseenter', () => {
                    bsCarousel.pause();
                });
                
                carousel.addEventListener('mouseleave', () => {
                    bsCarousel.cycle();
                });
            }
        }, 100);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Инициализация карусели товаров...');
    
    // Создаем экземпляры классов
    const productService = new CarouselProductService();
    const carouselRenderer = new CarouselRenderer(productService);
    
    // Загружаем данные
    await productService.loadProducts();
    
    // Рендерим карусель
    carouselRenderer.renderCarousel('products-carousel-container');
    
    // Обновляем счетчик корзины
    productService.updateCartCounter();
    
    // Делаем глобально доступными для отладки
    window.carouselProductService = productService;
    window.carouselRenderer = carouselRenderer;
    
    console.log('Карусель товаров инициализирована');
});