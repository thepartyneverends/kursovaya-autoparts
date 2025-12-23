class AllProductsPage {
            constructor() {
                this.products = [];
                this.categories = new Set();
                this.selectedCategory = 'all';
                this.searchQuery = '';
                this.cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
            }

            async loadProducts() {
                try {
                    const response = await fetch('data/products.json');
                    const data = await response.json();
                    this.products = data.products;
                    
                    // Собираем уникальные категории
                    this.products.forEach(product => {
                        if (product.category) {
                            this.categories.add(product.category);
                        }
                    });
                    
                    this.renderCategories();
                    this.renderProducts();
                    this.updateCartCount();
                    this.initSearch();
                    this.initCartListeners();
                } catch (error) {
                    console.error('Ошибка загрузки:', error);
                    this.showError();
                }
            }

            renderCategories() {
                const container = document.getElementById('categoriesList');
                if (!container) return;

                let categoriesHtml = `
                    <button class="category-btn active" data-category="all">
                        <i class="bi bi-grid-fill"></i>Все товары (${this.products.length})
                    </button>
                `;

                // Сортируем категории по алфавиту
                const sortedCategories = Array.from(this.categories).sort();
                
                sortedCategories.forEach(category => {
                    const count = this.products.filter(p => p.category === category).length;
                    categoriesHtml += `
                        <button class="category-btn" data-category="${category}">
                            <i class="bi bi-tag"></i>${category} (${count})
                        </button>
                    `;
                });

                container.innerHTML = categoriesHtml;
                this.attachCategoryListeners();
            }

            renderProducts() {
                const container = document.getElementById('productsContainer');
                if (!container) return;

                let filteredProducts = this.products;
                
                // Фильтрация по категории
                if (this.selectedCategory !== 'all') {
                    filteredProducts = filteredProducts.filter(p => p.category === this.selectedCategory);
                }
                
                // Фильтрация по поиску
                if (this.searchQuery) {
                    const query = this.searchQuery.toLowerCase();
                    filteredProducts = filteredProducts.filter(p => 
                        p.name.toLowerCase().includes(query) ||
                        (p.description && p.description.toLowerCase().includes(query)) ||
                        (p.category && p.category.toLowerCase().includes(query))
                    );
                }

                if (filteredProducts.length === 0) {
                    container.innerHTML = `
                        <div class="text-center py-5">
                            <i class="bi bi-inbox display-1 text-muted"></i>
                            <h4 class="mt-3">Товары не найдены</h4>
                            <p class="text-muted">Попробуйте выбрать другую категорию или изменить поисковый запрос</p>
                        </div>
                    `;
                    return;
                }

                const productsHtml = filteredProducts.map(product => {
                    // Подсветка поиска в названии
                    let productName = product.name;
                    if (this.searchQuery) {
                        const regex = new RegExp(`(${this.searchQuery})`, 'gi');
                        productName = productName.replace(regex, '<span class="search-highlight">$1</span>');
                    }
                    
                    return `
                    <div class="col-md-6 col-xl-4 mb-4">
                        <div class="product-card">
                            <img src="${product.image || 'https://via.placeholder.com/300x150/f8f9fa/6c757d?text=Нет+фото'}" 
                                 class="product-img w-100" alt="${product.name}"
                                 onerror="this.src='https://via.placeholder.com/300x150/f8f9fa/6c757d?text=Нет+фото'">
                            <div class="p-3">
                                <h6 class="mb-2">${productName}</h6>
                                <p class="text-muted small mb-2">${product.description || ''}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <span class="price">${this.formatPrice(product.price)} ₽</span>
                                        ${product.oldPrice ? `<span class="old-price ms-2">${this.formatPrice(product.oldPrice)} ₽</span>` : ''}
                                    </div>
                                    <span class="badge bg-light text-dark badge-category">${product.category || 'Без категории'}</span>
                                </div>
                                ${product.stock > 0 ? 
                                    `<button class="btn btn-sm btn-primary w-100 mt-2 add-to-cart" data-id="${product.id}">
                                        <i class="bi bi-cart-plus me-1"></i>В корзину
                                    </button>` :
                                    `<button class="btn btn-sm btn-secondary w-100 mt-2" disabled>
                                        <i class="bi bi-cart-x me-1"></i>Нет в наличии
                                    </button>`
                                }
                            </div>
                        </div>
                    </div>
                    `;
                }).join('');

                container.innerHTML = `<div class="row">${productsHtml}</div>`;
                
                // Привязываем обработчики к кнопкам корзины
                this.attachCartButtons();
            }

            attachCategoryListeners() {
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        // Убираем активный класс у всех кнопок
                        document.querySelectorAll('.category-btn').forEach(b => {
                            b.classList.remove('active');
                        });
                        
                        // Добавляем активный класс текущей кнопке
                        btn.classList.add('active');
                        
                        // Меняем категорию и перерисовываем товары
                        this.selectedCategory = btn.dataset.category;
                        this.renderProducts();
                    });
                });
            }

            initSearch() {
                const searchInput = document.getElementById('pageSearch');
                const clearButton = document.getElementById('clearSearch');
                
                // Поиск при вводе текста
                searchInput.addEventListener('input', (e) => {
                    this.searchQuery = e.target.value.trim();
                    this.renderProducts();
                });
                
                // Очистка поиска
                clearButton.addEventListener('click', () => {
                    searchInput.value = '';
                    this.searchQuery = '';
                    this.renderProducts();
                });
                
                // Поиск по Enter
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.searchQuery = searchInput.value.trim();
                        this.renderProducts();
                    }
                });
            }

            initCartListeners() {
                // Обновление корзины при изменении в других вкладках
                window.addEventListener('storage', (e) => {
                    if (e.key === 'cart') {
                        this.cartItems = JSON.parse(e.newValue || '[]');
                        this.updateCartCount();
                    }
                });
            }

            attachCartButtons() {
                document.querySelectorAll('.add-to-cart').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const productId = e.currentTarget.dataset.id;
                        this.addToCart(productId);
                    });
                });
            }

            addToCart(productId) {
                const product = this.products.find(p => p.id == productId);
                if (!product) return;
                
                // Ищем товар в корзине
                const existingItem = this.cartItems.find(item => item.id == productId);
                
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    this.cartItems.push({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        quantity: 1
                    });
                }
                
                // Сохраняем в localStorage
                localStorage.setItem('cart', JSON.stringify(this.cartItems));
                
                // Обновляем счетчик
                this.updateCartCount();
                
                // Анимация добавления
                this.showAddToCartAnimation(productId);
            }

            updateCartCount() {
                const totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
                const cartCountElement = document.querySelector('.cart-count');
                if (cartCountElement) {
                    cartCountElement.textContent = totalItems;
                }
            }

            showAddToCartAnimation(productId) {
                const button = document.querySelector(`.add-to-cart[data-id="${productId}"]`);
                if (!button) return;
                
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="bi bi-check-circle me-1"></i>Добавлено';
                button.classList.remove('btn-primary');
                button.classList.add('btn-success');
                button.disabled = true;
                
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.classList.remove('btn-success');
                    button.classList.add('btn-primary');
                    button.disabled = false;
                }, 1500);
            }

            formatPrice(price) {
                return price ? price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : '0';
            }

            showError() {
                const container = document.getElementById('productsContainer');
                if (container) {
                    container.innerHTML = `
                        <div class="text-center py-5">
                            <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
                            <h4 class="mt-3">Ошибка загрузки</h4>
                            <p class="text-muted">Не удалось загрузить товары. Проверьте наличие файла data/products.json</p>
                        </div>
                    `;
                }
            }
        }

        // Инициализация карусели с автопрокруткой
    document.addEventListener('DOMContentLoaded', function() {
        const promotionsCarousel = new bootstrap.Carousel(document.getElementById('promotionsCarousel'), {
            interval: 5000, // Смена каждые 5 секунд
            wrap: true,
            touch: true,
            pause: 'hover' // Пауза при наведении
        });
    });


    document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const domSelect = document.getElementById('dom');
    const hostSelect = document.getElementById('host');
    const adminSelect = document.getElementById('adm');
    const totalElement = document.getElementById('itogo');
    const domCostElement = document.getElementById('itogoDom');
    const hostCostElement = document.getElementById('itogoHost');
    const adminCostElement = document.getElementById('itogoAdmin');
    const resetBtn = document.getElementById('resetBtn');
    const copyBtn = document.getElementById('copyBtn');
    
    // Цены (значения из value атрибутов option)
    let domPrice = 0;
    let hostPrice = 0;
    let adminPrice = 0;
    
    // Функция форматирования чисел
    function formatNumber(num) {
      return num.toLocaleString('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    }
    
    // Функция обновления расчетов
    function updateCalculation() {
      // Получаем значения из select
      domPrice = parseInt(domSelect.value) || 0;
      hostPrice = parseInt(hostSelect.value) || 0;
      adminPrice = parseInt(adminSelect.value) || 0;
      
      // Пересчитываем домен (годовая цена в месячную)
      const domMonthly = domPrice / 12;
      
      // Общая стоимость в месяц
      const totalMonthly = domMonthly + hostPrice + adminPrice;
      
      // Обновляем отображение
      domCostElement.textContent = `${formatNumber(domPrice)} руб.`;
      hostCostElement.textContent = `${formatNumber(hostPrice)} руб.`;
      adminCostElement.textContent = `${formatNumber(adminPrice)} руб.`;
      totalElement.textContent = `${formatNumber(Math.round(totalMonthly))} ₽`;
      
      // Анимация изменения итоговой суммы
      totalElement.classList.add('pulse');
      setTimeout(() => {
        totalElement.classList.remove('pulse');
      }, 500);
      
      // Сохранение в localStorage
      saveSelection();
    }
    
    // Функция сброса
    function resetCalculator() {
      domSelect.selectedIndex = 0;
      hostSelect.selectedIndex = 0;
      adminSelect.selectedIndex = 0;
      
      updateCalculation();
      
      // Показать уведомление
      showNotification('Калькулятор сброшен', 'info');
    }
    
    // Функция копирования расчета
    function copyCalculation() {
      const domText = domSelect.options[domSelect.selectedIndex].text;
      const hostText = hostSelect.options[hostSelect.selectedIndex].text;
      const adminText = adminSelect.options[adminSelect.selectedIndex].text;
      const totalText = totalElement.textContent;
      
      const calculationText = `Расчет стоимости содержания проекта:
      
1. Домен: ${domText}
2. Хостинг: ${hostText}
3. Администрирование: ${adminText}

Итоговая стоимость: ${totalText} в месяц

*Создано с помощью калькулятора стоимости проекта`;
      
      // Копирование в буфер обмена
      navigator.clipboard.writeText(calculationText)
        .then(() => {
          showNotification('Расчет скопирован в буфер обмена!', 'success');
        })
        .catch(err => {
          console.error('Ошибка копирования:', err);
          showNotification('Не удалось скопировать', 'error');
        });
    }
    
    // Функция показа уведомления
    function showNotification(message, type = 'info') {
      // Создаем временное уведомление
      const alert = document.createElement('div');
      alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
      alert.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
      `;
      alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      
      document.body.appendChild(alert);
      
      // Удаляем через 3 секунды
      setTimeout(() => {
        alert.remove();
      }, 3000);
    }
    
    // Сохранение выбора в localStorage
    function saveSelection() {
      const selection = {
        domain: domSelect.value,
        hosting: hostSelect.value,
        admin: adminSelect.value,
        timestamp: new Date().getTime()
      };
      localStorage.setItem('calculatorSelection', JSON.stringify(selection));
    }
    
    function loadSelection() {
      const saved = localStorage.getItem('calculatorSelection');
      if (saved) {
        const selection = JSON.parse(saved);
        
        // Загружаем сохраненные значения
        domSelect.value = selection.domain;
        hostSelect.value = selection.hosting;
        adminSelect.value = selection.admin;
        
        // Обновляем расчет
        updateCalculation();
      }
    }
    
    // Обработчики событий
    [domSelect, hostSelect, adminSelect].forEach(select => {
      select.addEventListener('change', updateCalculation);
    });
    
    resetBtn.addEventListener('click', resetCalculator);
    copyBtn.addEventListener('click', copyCalculation);
    
    // Добавляем эффект при наведении на select
    const selects = document.querySelectorAll('.form-select-lg');
    selects.forEach(select => {
      select.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 0 0 3px rgba(74, 108, 247, 0.1)';
      });
      
      select.addEventListener('mouseleave', function() {
        this.style.boxShadow = '';
      });
    });
    
    // Инициализация калькулятора
    loadSelection();
    
    // Добавляем иконки для опций (опционально)
    function addIconsToOptions() {
      const domainIcon = '🌐';
      const hostingIcon = '🚀';
      const adminIcon = '👨‍💼';
      
      // Добавляем иконки к тексту опций
      const domainOptions = domSelect.querySelectorAll('option');
      domainOptions.forEach((option, index) => {
        if (index > 0) {
          option.textContent = domainIcon + ' ' + option.textContent;
        }
      });
      
      const hostingOptions = hostSelect.querySelectorAll('option');
      hostingOptions.forEach((option, index) => {
        if (index > 0) {
          option.textContent = hostingIcon + ' ' + option.textContent;
        }
      });
      
      const adminOptions = adminSelect.querySelectorAll('option');
      adminOptions.forEach((option, index) => {
        if (index > 0) {
          option.textContent = adminIcon + ' ' + option.textContent;
        }
      });
    }
    
    // Раскомментируйте для добавления иконок:
    // addIconsToOptions();
  });