const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const bundler = require('../services/bundler');

// 컴포넌트 목록 API
router.get('/list', (req, res) => {
    try {
        console.log('컴포넌트 목록 요청 받음');

        // 로깅 추가
        console.log('현재 작업 디렉토리:', process.cwd());

        // 번들 디렉토리 경로
        const bundlesDir = path.join(__dirname, '../../bundles');
        console.log('번들 디렉토리 경로:', bundlesDir);

        // 디렉토리 존재 확인
        if (!fs.existsSync(bundlesDir)) {
            console.error('번들 디렉토리가 존재하지 않습니다:', bundlesDir);

            // bundles 디렉토리가 없다면 생성하고 샘플 컴포넌트 폴더 구조 추가
            fs.mkdirSync(bundlesDir, { recursive: true });

            // 샘플 컴포넌트 폴더 생성
            createSampleComponentStructure(bundlesDir);

            console.log('샘플 컴포넌트 디렉토리 구조가 생성되었습니다.');
        }

        // 번들러 서비스에서 컴포넌트 목록 가져오기
        const components = bundler.getComponentsList();

        // 컴포넌트가 없으면 샘플 데이터 제공
        if (components.length === 0) {
            console.log('컴포넌트를 찾을 수 없어 샘플 데이터를 반환합니다.');
            return res.json({
                success: true,
                components: getSampleComponents()
            });
        }

        console.log(`${components.length}개 컴포넌트 발견됨`);

        // 결과 반환
        return res.json({
            success: true,
            components: components
        });
    } catch (error) {
        console.error('컴포넌트 목록 조회 오류:', error);

        // 오류 응답
        return res.status(500).json({
            success: false,
            error: '컴포넌트 목록을 불러오는데 실패했습니다: ' + (error.message || '알 수 없는 오류')
        });
    }
});

// 디버깅을 위한 도구 - 서버 환경 정보 API
router.get('/debug', (req, res) => {
    const debugInfo = {
        platform: process.platform,
        cwd: process.cwd(),
        nodeVersion: process.version,
        paths: {
            bundlesDir: path.join(__dirname, '../../bundles'),
            tempDir: path.join(__dirname, '../../temp')
        },
        env: process.env.NODE_ENV || 'development'
    };

    // bundles 디렉토리 내용 검사
    try {
        const bundlesDir = path.join(__dirname, '../../bundles');
        if (fs.existsSync(bundlesDir)) {
            debugInfo.bundlesDirExists = true;
            debugInfo.bundlesDirContents = fs.readdirSync(bundlesDir);
        } else {
            debugInfo.bundlesDirExists = false;
        }
    } catch (error) {
        debugInfo.bundlesDirError = error.message;
    }

    return res.json(debugInfo);
});

// 샘플 컴포넌트 데이터 생성
function getSampleComponents() {
    return [
        {
            id: 'toast',
            name: 'Toast',
            description: '알림 메시지를 표시하는 토스트 컴포넌트',
            version: '1.0.0',
            category: 'UI',
            tags: ['notification', 'alert', 'message'],
            available: true,
            dependencies: ['remixicon']
        },
        {
            id: 'counter',
            name: 'Counter',
            description: '숫자를 증가/감소시키는 카운터 컴포넌트',
            version: '1.0.0',
            category: 'UI',
            tags: ['counter', 'number', 'input'],
            available: true
        },
        {
            id: 'dropdown',
            name: 'Dropdown',
            description: '드롭다운 메뉴 컴포넌트',
            version: '1.0.0',
            category: 'Navigation',
            tags: ['menu', 'dropdown', 'navigation'],
            available: true
        },
        {
            id: 'region-selector',
            name: 'Region Selector',
            description: '지역 선택 컴포넌트',
            version: '1.0.0',
            category: 'Form',
            tags: ['select', 'region', 'location'],
            available: true
        }
    ];
}

// 샘플 컴포넌트 폴더 구조 생성
function createSampleComponentStructure(bundlesDir) {
    const sampleComponents = getSampleComponents();

    sampleComponents.forEach(comp => {
        const componentDir = path.join(bundlesDir, comp.id);
        const distDir = path.join(componentDir, 'dist');

        // 디렉토리 생성
        fs.mkdirSync(distDir, { recursive: true });

        // 컴포넌트 정보 파일 생성
        const infoPath = path.join(componentDir, 'component-info.json');
        fs.writeFileSync(infoPath, JSON.stringify({
            name: comp.name,
            description: comp.description,
            version: comp.version,
            category: comp.category,
            tags: comp.tags,
            dependencies: comp.dependencies || []
        }, null, 2));

        // 샘플 번들 파일 생성
        const bundleJsPath = path.join(distDir, `${comp.id}-bundle.js`);
        fs.writeFileSync(bundleJsPath, getSampleComponentCode(comp.id));

        // 샘플 스타일 파일 생성
        const styleCssPath = path.join(distDir, `${comp.id}-styles.css`);
        fs.writeFileSync(styleCssPath, getSampleComponentStyles(comp.id));
    });
}

// 샘플 컴포넌트 코드 생성
function getSampleComponentCode(componentId) {
    switch (componentId) {
        case 'toast':
            return `// 토스트 컴포넌트
(function() {
  const ToastComponent = {
    registerToast: function(config) {
      if (typeof customElements.get('my-toast') === 'undefined') {
        customElements.define('my-toast', class extends HTMLElement {
          constructor() {
            super();
            this.position = this.getAttribute('position') || 'top-right';
            this.duration = parseInt(this.getAttribute('duration')) || 3000;
            
            this.innerHTML = \`
              <div x-data="toast" class="toast-wrapper">
                <div class="toast-container \${this.position}">
                  <template x-for="toast in toasts" :key="toast.id">
                    <div class="toast-item" :class="toast.type">
                      <div class="toast-content">
                        <i class="ri-information-line toast-icon"></i>
                        <div class="toast-message">
                          <span class="toast-description" x-text="toast.message"></span>
                        </div>
                      </div>
                      <button class="toast-close" @click="removeToast(toast.id)">
                        <i class="ri-close-line"></i>
                      </button>
                    </div>
                  </template>
                </div>
              </div>
            \`;
            
            this.addEventListener('show-toast', (e) => {
              if (e.detail) {
                const alpineData = Alpine.$data(this.querySelector('[x-data="toast"]'));
                if (alpineData) {
                  alpineData.addToast(e.detail);
                }
              }
            });
          }
        });
      }
      
      document.addEventListener('alpine:init', () => {
        Alpine.data('toast', () => ({
          toasts: [],
          addToast(data) {
            const id = Date.now();
            const toast = {
              id,
              message: data.message || 'Notification',
              type: data.type || 'info',
              duration: data.duration || this.duration || 3000
            };
            
            this.toasts.push(toast);
            
            setTimeout(() => {
              this.removeToast(id);
            }, toast.duration);
          },
          removeToast(id) {
            this.toasts = this.toasts.filter(toast => toast.id !== id);
          }
        }));
      });
      
      // 글로벌 toast API 등록
      if (typeof window !== 'undefined') {
        window.toast = {
          info(message, options = {}) {
            this._showToast({ message, type: 'info', ...options });
          },
          success(message, options = {}) {
            this._showToast({ message, type: 'success', ...options });
          },
          warning(message, options = {}) {
            this._showToast({ message, type: 'warning', ...options });
          },
          error(message, options = {}) {
            this._showToast({ message, type: 'error', ...options });
          },
          _showToast(data) {
            const toastEl = document.querySelector('my-toast') || document.body.appendChild(document.createElement('my-toast'));
            toastEl.dispatchEvent(new CustomEvent('show-toast', { detail: data }));
          }
        };
      }
      
      console.log('Toast 컴포넌트가 등록되었습니다');
      return this;
    }
  };
  
  if (typeof window !== 'undefined') {
    window.ToastComponent = ToastComponent;
  }
})();`;

        case 'counter':
            return `// 카운터 컴포넌트
(function() {
  const CounterComponent = {
    registerCounter: function(config = {}) {
      const defaults = {
        count: 0,
        step: 1
      };
      
      const settings = { ...defaults, ...config };
      
      // Alpine 컴포넌트 등록
      if (typeof Alpine !== 'undefined' && typeof Alpine.data === 'function') {
        Alpine.data('counter', () => ({
          count: settings.count,
          step: settings.step,
          increment() {
            this.count += this.step;
          },
          decrement() {
            this.count -= this.step;
          }
        }));
      }
      
      return {
        settings,
        mount: (el) => {
          el.innerHTML = \`
            <div x-data="counter" class="alpine-counter-component">
              <div class="alpine-counter-component__display">
                <h3>카운터</h3>
                <p>현재 값: <span x-text="count"></span></p>
              </div>
              <div class="alpine-counter-component__controls">
                <button x-on:click="increment()" class="increment">증가 (+)</button>
                <button x-on:click="decrement()" class="decrement">감소 (-)</button>
              </div>
            </div>
          \`;
          
          return el;
        }
      };
    }
  };
  
  if (typeof window !== 'undefined') {
    window.CounterComponent = CounterComponent;
    
    if (!customElements.get('my-counter')) {
      class MyCounter extends HTMLElement {
        connectedCallback() {
          const start = this.getAttribute('start');
          const step = this.getAttribute('step');
          const config = {};
          
          if (start) config.count = parseInt(start) || 0;
          if (step) config.step = parseInt(step) || 1;
          
          const counter = CounterComponent.registerCounter(config);
          counter.mount(this);
        }
      }
      
      customElements.define('my-counter', MyCounter);
      console.log('my-counter 커스텀 엘리먼트가 등록되었습니다');
    }
  }
})();`;

        case 'dropdown':
            return `// 드롭다운 컴포넌트
(function() {
  if (!customElements.get('my-dropdown')) {
    customElements.define('my-dropdown', class extends HTMLElement {
      constructor() {
        super();
        this.label = this.getAttribute('label') || 'Dropdown';
        this.isOpen = false;
        
        this.innerHTML = \`
          <div x-data="{ open: false }" class="alpine-dropdown">
            <button @click="open = !open" class="dropdown-toggle">
              ${this.label} <span class="dropdown-arrow" :class="{ 'open': open }">▼</span>
            </button>
            <div x-show="open" @click.outside="open = false" class="dropdown-menu">
              <slot></slot>
            </div>
          </div>
        \`;
      }
    });
    
    console.log('my-dropdown custom element defined');
  }
})();`;

        case 'region-selector':
            return `// 지역 선택기 컴포넌트
(function() {
  if (!customElements.get('region-selector')) {
    customElements.define('region-selector', class extends HTMLElement {
      constructor() {
        super();
        this.provinces = [];
        this.cities = [];
        this.selectedProvince = null;
        this.selectedCity = null;
        
        this.render();
        
        // 컴포넌트가 준비되었음을 알림
        setTimeout(() => {
          this.dispatchEvent(new CustomEvent('region-selector-ready'));
        }, 0);
      }
      
      render() {
        this.innerHTML = \`
          <div class="region-selector-container" x-data="{ 
            provinces: [], 
            cities: [],
            selectedProvince: null,
            selectedCity: null,
            
            selectProvince(id) {
              this.selectedProvince = id;
              this.selectedCity = null;
              this.dispatchProvinceChanged(id);
            },
            
            selectCity(id) {
              this.selectedCity = id;
              this.dispatchCityChanged(id);
            },
            
            dispatchProvinceChanged(id) {
              const event = new CustomEvent('province-changed', {
                detail: { provinceId: id }
              });
              this.$el.closest('region-selector').dispatchEvent(event);
            },
            
            dispatchCityChanged(id) {
              const event = new CustomEvent('city-changed', {
                detail: { cityId: id }
              });
              this.$el.closest('region-selector').dispatchEvent(event);
            }
          }">
            <div class="region-selector-provinces">
              <label for="province-select">지역</label>
              <select id="province-select" x-model="selectedProvince" @change="selectProvince($event.target.value)">
                <option value="" disabled selected>지역을 선택하세요</option>
                <template x-for="province in provinces" :key="province.id">
                  <option :value="province.id" x-text="province.name"></option>
                </template>
              </select>
            </div>
            
            <div class="region-selector-cities" x-show="cities.length > 0">
              <label for="city-select">도시</label>
              <select id="city-select" x-model="selectedCity" @change="selectCity($event.target.value)">
                <option value="" disabled selected>도시를 선택하세요</option>
                <template x-for="city in cities" :key="city.id">
                  <option :value="city.id" x-text="city.name"></option>
                </template>
              </select>
            </div>
          </div>
        \`;
      }
      
      setProvinces(provinces) {
        this.provinces = provinces;
        const container = this.querySelector('.region-selector-container');
        if (container && Alpine) {
          const data = Alpine.$data(container);
          data.provinces = provinces;
        }
      }
      
      setCities(cities) {
        this.cities = cities;
        const container = this.querySelector('.region-selector-container');
        if (container && Alpine) {
          const data = Alpine.$data(container);
          data.cities = cities;
        }
      }
    });
    
    console.log('region-selector custom element defined');
  }
})();`;

        default:
            return `// ${componentId} 컴포넌트
(function() {
  console.log('${componentId} 컴포넌트 로드됨');
  
  // 여기에 ${componentId} 컴포넌트 코드가 들어갑니다
})();`;
    }
}

// 샘플 컴포넌트 스타일 생성
function getSampleComponentStyles(componentId) {
    switch (componentId) {
        case 'toast':
            return `/* 토스트 컴포넌트 스타일 */
.toast-wrapper {
  position: fixed;
  z-index: 9999;
  width: 100%;
  height: 0;
  pointer-events: none;
}

.toast-container {
  position: absolute;
  max-width: 350px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: auto;
}

.toast-container.top-right {
  top: 20px;
  right: 20px;
}

.toast-container.top-left {
  top: 20px;
  left: 20px;
}

.toast-container.bottom-right {
  bottom: 20px;
  right: 20px;
}

.toast-container.bottom-left {
  bottom: 20px;
  left: 20px;
}

.toast-container.top-center {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.toast-container.bottom-center {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.toast-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: toast-in 0.3s ease-out forwards;
  overflow: hidden;
  max-width: 100%;
}

.toast-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.toast-item.info::before {
  background-color: #2196F3;
}

.toast-item.success::before {
  background-color: #4CAF50;
}

.toast-item.warning::before {
  background-color: #FF9800;
}

.toast-item.error::before {
  background-color: #F44336;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.toast-icon {
  font-size: 20px;
}

.toast-item.info .toast-icon {
  color: #2196F3;
}

.toast-item.success .toast-icon {
  color: #4CAF50;
}

.toast-item.warning .toast-icon {
  color: #FF9800;
}

.toast-item.error .toast-icon {
  color: #F44336;
}

.toast-message {
  display: flex;
  flex-direction: column;
}

.toast-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.toast-description {
  font-size: 13px;
  color: #666;
}

.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  margin-left: 10px;
  padding: 0;
  font-size: 18px;
  line-height: 1;
  transition: color 0.2s;
}

.toast-close:hover {
  color: #333;
}

/* 애니메이션 */
@keyframes toast-in {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.toast-enter {
  animation: toast-in 0.3s ease-out forwards;
}

.toast-enter-start {
  transform: translateY(-20px);
  opacity: 0;
}

.toast-enter-end {
  transform: translateY(0);
  opacity: 1;
}

.toast-leave {
  animation: toast-out 0.3s ease-in forwards;
}

.toast-leave-start {
  transform: translateY(0);
  opacity: 1;
}

.toast-leave-end {
  transform: translateY(-20px);
  opacity: 0;
}

@keyframes toast-out {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-20px);
    opacity: 0;
  }
}`;

        case 'counter':
            return `/* 카운터 컴포넌트 스타일 */
.alpine-counter-component {
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 300px;
}

.alpine-counter-component__display {
  text-align: center;
  margin-bottom: 16px;
}

.alpine-counter-component__display h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 18px;
  color: #333;
}

.alpine-counter-component__display p {
  margin: 0;
  font-size: 16px;
  color: #666;
}

.alpine-counter-component__display span {
  font-weight: bold;
  font-size: 20px;
  color: #333;
}

.alpine-counter-component__controls {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.alpine-counter-component__controls button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.alpine-counter-component__controls button:hover {
  transform: translateY(-2px);
}

.alpine-counter-component__controls button:active {
  transform: translateY(0);
}

.alpine-counter-component__controls button.increment {
  background-color: #4caf50;
  color: white;
}

.alpine-counter-component__controls button.increment:hover {
  background-color: #3e9c42;
}

.alpine-counter-component__controls button.decrement {
  background-color: #f44336;
  color: white;
}

.alpine-counter-component__controls button.decrement:hover {
  background-color: #d63a2f;
}`;

        case 'dropdown':
            return `/* 드롭다운 컴포넌트 스타일 */
.alpine-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-toggle {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.dropdown-toggle:hover {
  background-color: #e9e9e9;
}

.dropdown-arrow {
  margin-left: 8px;
  font-size: 10px;
  transition: transform 0.2s;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 200px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}

.dropdown-item {
  display: block;
  padding: 8px 16px;
  color: #333;
  text-decoration: none;
  transition: background-color 0.2s;
  font-size: 14px;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}`;

        case 'region-selector':
            return `/* 지역 선택기 컴포넌트 스타일 */
.region-selector-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  max-width: 500px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.region-selector-provinces,
.region-selector-cities {
  flex: 1 1 200px;
}

.region-selector-container label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.region-selector-container select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
}

.region-selector-container select:focus {
  outline: none;
  border-color: #4361ee;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

.region-selector-container select option {
  padding: 10px;
}`;

        default:
            return `/* ${componentId} 컴포넌트 스타일 */
.${componentId}-container {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}`;
    }
}

module.exports = router;