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
  });