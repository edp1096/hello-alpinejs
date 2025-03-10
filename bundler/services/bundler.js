const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const esbuild = require('esbuild');
const archiver = require('archiver');

// 임시 디렉토리
const tempDir = path.join(__dirname, '../../temp');

// 번들 ID 생성 
function generateBundleId() {
  return crypto.randomBytes(8).toString('hex');
}

// 중간 통합 파일 생성
async function createIntermediateFile(components) {
  const intermediateDir = path.join(tempDir, 'intermediate');
  if (!fs.existsSync(intermediateDir)) {
    fs.mkdirSync(intermediateDir, { recursive: true });
  }

  const entryFilePath = path.join(intermediateDir, 'entry.js');

  // 각 컴포넌트에 대한 import 구문 생성
  const imports = components.map((comp, index) => {
    const jsPath = path.join(__dirname, '../../bundles', comp, 'dist', `${comp}-bundle.js`);
    if (fs.existsSync(jsPath)) {
      // 파일이 있으면 컴포넌트 스크립트 내용 추출
      return `// ${comp} component\nimport './${comp}-script.js';`;
    }
    return '';
  }).filter(Boolean).join('\n');

  // 메인 진입점 파일 생성
  fs.writeFileSync(entryFilePath, `${imports}\n\n// Alpine.js 컴포넌트 초기화\ndocument.addEventListener('DOMContentLoaded', () => {\n  console.log('Alpine.js 컴포넌트 초기화');\n});\n`);

  // 각 컴포넌트 스크립트를 별도 파일로 복사 (esbuild가 처리할 수 있도록)
  components.forEach(comp => {
    const jsPath = path.join(__dirname, '../../bundles', comp, 'dist', `${comp}-bundle.js`);
    if (fs.existsSync(jsPath)) {
      const destPath = path.join(intermediateDir, `${comp}-script.js`);
      fs.copyFileSync(jsPath, destPath);
    }
  });

  return entryFilePath;
}

// 번들 생성
async function createBundle(components, options = {}) {
  const bundleId = generateBundleId();
  const outputDir = path.join(tempDir, bundleId);

  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // 중간 통합 파일 생성
    const entryFilePath = await createIntermediateFile(components);

    // CSS 파일 엔트리포인트 수집
    const cssEntrypoints = components
      .map(comp => {
        const cssPath = path.join(__dirname, '../../bundles', comp, 'dist', `${comp}-styles.css`);
        return fs.existsSync(cssPath) ? cssPath : null;
      })
      .filter(Boolean);

    // JS 번들링 (esbuild 사용)
    await esbuild.build({
      entryPoints: [entryFilePath],
      outfile: path.join(outputDir, 'alpine-components.js'),
      bundle: true,
      minify: options.minify !== false,
      sourcemap: options.sourcemap === true,
      format: 'iife',
      platform: 'browser',
      target: ['es2020'],
      loader: {
        '.js': 'js'
      },
    });

    // CSS 파일 병합 (단순 연결 방식)
    if (cssEntrypoints.length > 0) {
      const cssContent = cssEntrypoints
        .map(file => fs.readFileSync(file, 'utf8'))
        .join('\n\n');

      fs.writeFileSync(path.join(outputDir, 'alpine-components.css'), cssContent);
    }

    // 컴포넌트별 기능 테스트를 위한 예제 HTML 생성
    createExampleHtml(outputDir, components);

    // README 파일 생성
    createReadme(outputDir, components);

    // 모든 파일을 ZIP으로 압축
    await zipBundle(outputDir, path.join(tempDir, `${bundleId}.zip`));

    return {
      bundleId,
      success: true
    };
  } catch (error) {
    console.error('번들링 오류:', error);
    throw error;
  }
}

// 예제 HTML 파일 생성
function createExampleHtml(outputDir, components) {
  // 필요한 외부 의존성 확인
  const needsRemixIcon = components.includes('toast');

  let html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alpine.js 컴포넌트 예제</title>
  
  <!-- Alpine.js -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  
  ${needsRemixIcon ? '<!-- Remix Icon (토스트 컴포넌트용) -->\n  <link href="https://cdn.jsdelivr.net/npm/remixicon@3.2.0/fonts/remixicon.css" rel="stylesheet">\n' : ''}
  
  <!-- 컴포넌트 스타일 -->
  <link rel="stylesheet" href="alpine-components.css">
  
  <!-- 컴포넌트 스크립트 -->
  <script src="alpine-components.js"></script>
  
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .container { margin-bottom: 40px; padding: 15px; border: 1px solid #eee; border-radius: 8px; }
    h1 { margin-bottom: 2rem; }
    h2 { margin-top: 2rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
    .container button { padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .container button:hover { background: #45a049; }
    code { background-color: #f5f5f5; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    
    /* 전역 링크 스타일 - 컴포넌트 내부 링크에는 적용되지 않도록 */
    .container > a { color: #2196F3; text-decoration: none; }
    .container > a:hover { text-decoration: underline; }
    
    /* 컴포넌트별 추가 스타일 */
    .result-container { margin-top: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
    .demo-buttons { margin: 10px 0; display: flex; gap: 10px; }
    
    /* 캘린더 관련 스타일 */
    .datepicker-container { position: relative; margin-bottom: 20px; }
    .datepicker-popup { position: absolute; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); padding: 10px; }
    .date-input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    
    /* 슬라이더 관련 스타일 */
    .slider-controls { margin-top: 10px; }
    
    /* 드롭다운 디버그 정보 */
    .dropdown-debug { 
      margin-top: 10px; 
      padding: 5px 10px; 
      background-color: #f8f9fa; 
      border-radius: 4px; 
      font-size: 12px; 
      color: #666; 
    }
  </style>
</head>
<body>
  <h1>Alpine.js 컴포넌트 예제</h1>
`;

  // 컴포넌트별 예제 추가
  components.forEach(comp => {
    switch (comp) {
      case 'toast':
        html += `
  <div class="container">
    <h2>Toast 컴포넌트</h2>
    <p>알림 메시지를 표시하는 토스트 컴포넌트입니다.</p>
    
    <div class="demo-buttons">
      <button id="show-info-toast">정보 토스트</button>
      <button id="show-success-toast">성공 토스트</button>
      <button id="show-warning-toast">경고 토스트</button>
      <button id="show-error-toast">오류 토스트</button>
    </div>
    
    <my-toast id="toast-container"></my-toast>
    
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        if (window.ToastComponent) {
          ToastComponent.registerToast();
          console.log("Toast component registered");
          
          // 버튼 이벤트 리스너
          document.getElementById('show-info-toast').addEventListener('click', () => {
            if (window.toast) {
              window.toast.info('정보 메시지입니다.');
            } else {
              document.getElementById('toast-container').dispatchEvent(
                new CustomEvent('show-toast', {
                  detail: { message: '정보 메시지입니다.', type: 'info' }
                })
              );
            }
          });
          
          document.getElementById('show-success-toast').addEventListener('click', () => {
            if (window.toast) {
              window.toast.success('성공 메시지입니다.');
            } else {
              document.getElementById('toast-container').dispatchEvent(
                new CustomEvent('show-toast', {
                  detail: { message: '성공 메시지입니다.', type: 'success' }
                })
              );
            }
          });
          
          document.getElementById('show-warning-toast').addEventListener('click', () => {
            if (window.toast) {
              window.toast.warning('경고 메시지입니다.');
            } else {
              document.getElementById('toast-container').dispatchEvent(
                new CustomEvent('show-toast', {
                  detail: { message: '경고 메시지입니다.', type: 'warning' }
                })
              );
            }
          });
          
          document.getElementById('show-error-toast').addEventListener('click', () => {
            if (window.toast) {
              window.toast.error('오류 메시지입니다.');
            } else {
              document.getElementById('toast-container').dispatchEvent(
                new CustomEvent('show-toast', {
                  detail: { message: '오류 메시지입니다.', type: 'error' }
                })
              );
            }
          });
        }
      });
    </script>
  </div>
`;
        break;

      case 'counter':
        html += `
  <div class="container">
    <h2>Counter 컴포넌트</h2>
    <p>숫자를 증가/감소시키는 카운터 컴포넌트입니다.</p>
    
    <my-counter id="demo-counter" start="5" step="1"></my-counter>
    
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        if (window.CounterComponent) {
          // 필요한 경우 커스텀 엘리먼트 등록
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
            console.log("Counter custom element defined");
          }
        }
      });
    </script>
  </div>
`;
        break;

      case 'dropdown':
        html += `
  <div class="container">
    <h2>Dropdown 컴포넌트</h2>
    <p>드롭다운 메뉴 컴포넌트입니다.</p>
    
    <style>
      /* 드롭다운 컴포넌트 스타일 오버라이드 */
      .alpine-dropdown .dropdown-toggle {
        display: inline-flex;
        align-items: center;
        padding: 8px 16px;
        background-color: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
      }
      
      .alpine-dropdown .dropdown-toggle:hover {
        background-color: #e9e9e9;
      }
      
      .alpine-dropdown .dropdown-arrow {
        margin-left: 8px;
        font-size: 10px;
        transition: transform 0.2s;
      }
      
      .alpine-dropdown .dropdown-arrow.open {
        transform: rotate(180deg);
      }
      
      .alpine-dropdown .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 4px;
        min-width: 180px;
        background-color: white;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        padding: 8px 0;
      }
      
      .alpine-dropdown .dropdown-item {
        display: block;
        padding: 8px 16px;
        color: #333;
        text-decoration: none;
        transition: background-color 0.2s;
        font-size: 14px;
      }
      
      .alpine-dropdown .dropdown-item:hover {
        background-color: #f5f5f5;
      }
      
      /* 결과 표시 영역 */
      #dropdown-result {
        margin-top: 10px;
        padding: 10px;
        background-color: #f0f8ff;
        border-radius: 4px;
        font-size: 14px;
      }
    </style>
    
    <div class="dropdown-examples">
      <h3>1. 옵션 태그를 사용한 방식</h3>
      <my-dropdown id="direct-dropdown" selected="내 정보" on-select="handleOptionSelected">
        <option value="profile" icon="ri-user-3-line" url="/profile">내 정보</option>
        <option value="settings" icon="ri-settings-3-line" url="/settings">설정</option>
        <option value="logout" icon="ri-logout-box-line" url="/logout" disabled="true">로그아웃</option>
      </my-dropdown>
      
      <h3 style="margin-top: 30px;">2. JSON 속성을 사용한 방식</h3>
      <my-dropdown id="custom-dropdown" options='[
          {"name": "프로필", "icon": "ri-user-3-line"},
          {"name": "설정", "icon": "ri-settings-3-line"},
          {"name": "로그아웃", "icon": "ri-logout-box-line", "disabled": true}
      ]' selected='{"name": "설정", "icon": "ri-settings-3-line"}' on-select="handleOptionSelected"></my-dropdown>
      
      <div id="dropdown-result">
        선택 결과가 여기에 표시됩니다.
      </div>
    </div>
    
    <script>
      // 전역 dropdown 이벤트 핸들러
      window.handleOptionSelected = function(option) {
        console.log('Selected option:', option);
        
        const resultElement = document.getElementById('dropdown-result');
        if (resultElement) {
          if (option.disabled) {
            resultElement.innerHTML = '<strong>비활성화된 옵션:</strong> ' + (option.name || option.textContent);
            return;
          }
          
          resultElement.innerHTML = '<strong>선택된 옵션:</strong> ' + (option.name || option.textContent);
          
          if (option.icon) {
            resultElement.innerHTML += ' (' + option.icon + ')';
          }
          
          if (option.url) {
            resultElement.innerHTML += ' - URL: ' + option.url;
          }
        }
      };
      
      document.addEventListener('DOMContentLoaded', () => {
        // RemixIcon이 로드되었는지 확인
        if (!document.querySelector('link[href*="remixicon"]')) {
          console.warn('RemixIcon이 로드되지 않았습니다. 아이콘이 표시되지 않을 수 있습니다.');
        }
        
        // 드롭다운 이벤트 리스너 등록
        const directDropdown = document.getElementById('direct-dropdown');
        if (directDropdown) {
          directDropdown.addEventListener('option-selected', (event) => {
            console.log('Event received from direct-dropdown:', event.detail);
          });
        }
        
        const customDropdown = document.getElementById('custom-dropdown');
        if (customDropdown) {
          customDropdown.addEventListener('option-selected', (event) => {
            console.log('Event received from custom-dropdown:', event.detail);
          });
        }
      });
    </script>
  </div>
`;
        break;

      case 'region-selector':
        html += `
  <div class="container">
    <h2>Region Selector 컴포넌트</h2>
    <p>지역 선택 컴포넌트입니다.</p>
    
    <region-selector id="demo-region-selector"></region-selector>
    <div class="result-container" id="region-result">선택된 지역이 여기에 표시됩니다.</div>

    <script>
      document.addEventListener('DOMContentLoaded', () => {
        // 예제 데이터
        const cities = [
          { id: 'seoul', name: '서울', count: 458 },
          { id: 'busan', name: '부산', count: 357 },
          { id: 'incheon', name: '인천', count: 198 },
          { id: 'daegu', name: '대구', count: 156 },
          { id: 'gyeonggi', name: '경기', count: 512 }
        ];
        
        const districts = [
          // 서울
          { id: 'seoul-gangnam', cityId: 'seoul', name: '강남구', count: 87 },
          { id: 'seoul-jongno', cityId: 'seoul', name: '종로구', count: 43 },
          { id: 'seoul-mapo', cityId: 'seoul', name: '마포구', count: 56 },
          // 부산
          { id: 'busan-haeundae', cityId: 'busan', name: '해운대구', count: 106 },
          { id: 'busan-suyeong', cityId: 'busan', name: '수영구', count: 48 },
          // 인천
          { id: 'incheon-yeonsu', cityId: 'incheon', name: '연수구', count: 42 }
        ];
        
        // 결과 표시 함수
        function updateResultElement(data) {
          const resultElement = document.getElementById('region-result');
          if (!resultElement) return;
          
          if (data.city && data.district) {
            resultElement.innerHTML = \`<strong>선택된 지역:</strong> \${data.city.name} > \${data.district.name} (\${data.district.count}개)\`;
          } else if (data.city) {
            resultElement.innerHTML = \`<strong>선택된 지역:</strong> \${data.city.name} (\${data.city.count}개)\`;
          } else {
            resultElement.innerHTML = '<strong>선택된 지역:</strong> 전체 지역';
          }
        }
        
        // 컴포넌트 초기화
        if (window.RegionSelectorComponent) {
          const controller = RegionSelectorComponent.registerRegionSelector({
            cities: cities,
            districts: districts
          });
          
          // 선택기 콜백 설정
          const regionSelector = document.getElementById('demo-region-selector');
          if (regionSelector) {
            regionSelector.onRegionSelected = function(data) {
              updateResultElement(data);
              console.log('Region selected:', data);
            };
            
            // 이벤트 리스너 추가
            regionSelector.addEventListener('region-selected', (e) => {
              console.log('Region selected event:', e.detail);
            });
            
            // DOM 준비 이벤트
            regionSelector.addEventListener('region-selector-ready', () => {
              console.log('Region selector is ready');
            });
          }
        }
      });
    </script>
  </div>
`;
        break;

      case 'slider':
        html += `
  <div class="container">
    <h2>Slider 컴포넌트</h2>
    <p>이미지 슬라이더 컴포넌트입니다.</p>
    
    <div id="slider-container">
      <my-slider id="demo-slider"></my-slider>
    </div>
    
    <div class="slider-controls">
      <button id="init-slider">슬라이더 초기화</button>
      <button id="update-slider">슬라이더 업데이트</button>
    </div>
    
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        if (window.SliderComponent) {
          // 슬라이더 컴포넌트 등록
          SliderComponent.registerSlider();
          console.log('Slider component registered');
          
          // 초기화 함수
          function initSlider() {
            console.log('Initializing slider...');
            
            const slider = document.getElementById('demo-slider');
            if (!slider) return;
            
            // 슬라이더 설정
            const initialConfig = {
              transitionType: "slide",
              autoplayEnabled: true,
              interval: 5,
              showIndicators: true,
              images: [
                { src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%234CAF50' /%3E%3Ctext x='400' y='200' font-family='Arial' font-size='36' fill='white' text-anchor='middle' dominant-baseline='middle'%3E샘플 이미지 1%3C/text%3E%3C/svg%3E", alt: "샘플 이미지 1" },
                { src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%232196F3' /%3E%3Ctext x='400' y='200' font-family='Arial' font-size='36' fill='white' text-anchor='middle' dominant-baseline='middle'%3E샘플 이미지 2%3C/text%3E%3C/svg%3E", alt: "샘플 이미지 2" }
              ]
            };
            
            // 새 슬라이더 요소 생성
            const newSlider = document.createElement('my-slider');
            newSlider.id = "demo-slider";
            newSlider.setAttribute('config', JSON.stringify(initialConfig));
            
            // 기존 슬라이더 교체
            slider.replaceWith(newSlider);
            console.log('Slider initialized');
          }
          
          // 업데이트 함수
          function updateSlider() {
            console.log('Updating slider...');
            
            const slider = document.getElementById('demo-slider');
            if (!slider) return;
            
            // 업데이트된 설정
            const updatedConfig = {
              transitionType: "fade",
              autoplayEnabled: true,
              interval: 3,
              showIndicators: true,
              showControl: true,
              images: [
                { src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23F44336' /%3E%3Ctext x='400' y='200' font-family='Arial' font-size='36' fill='white' text-anchor='middle' dominant-baseline='middle'%3E샘플 이미지 3%3C/text%3E%3C/svg%3E", alt: "샘플 이미지 3" },
                { src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23FF9800' /%3E%3Ctext x='400' y='200' font-family='Arial' font-size='36' fill='white' text-anchor='middle' dominant-baseline='middle'%3E샘플 이미지 4%3C/text%3E%3C/svg%3E", alt: "샘플 이미지 4" },
                { src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%239C27B0' /%3E%3Ctext x='400' y='200' font-family='Arial' font-size='36' fill='white' text-anchor='middle' dominant-baseline='middle'%3E샘플 이미지 5%3C/text%3E%3C/svg%3E", alt: "샘플 이미지 5" }
              ]
            };
            
            // 새 슬라이더 요소 생성
            const newSlider = document.createElement('my-slider');
            newSlider.id = "demo-slider";
            newSlider.setAttribute('config', JSON.stringify(updatedConfig));
            
            // 기존 슬라이더 교체
            slider.replaceWith(newSlider);
            console.log('Slider updated');
          }
          
          // 버튼 이벤트 리스너
          document.getElementById('init-slider').addEventListener('click', initSlider);
          document.getElementById('update-slider').addEventListener('click', updateSlider);
          
          // 초기 슬라이더 설정
          setTimeout(initSlider, 500);
        }
      });
    </script>
  </div>
`;
        break;

      case 'calendar':
        html += `
  <div class="container">
    <h2>Calendar 컴포넌트</h2>
    <p>날짜 선택 캘린더 컴포넌트입니다.</p>
    
    <div id="calendar-container"></div>
    
    <h3 style="margin-top: 20px;">커스텀 태그 방식 캘린더</h3>
    <div id="custom-calendar-container"></div>
    <button id="create-custom-calendar">커스텀 태그 생성</button>
    <div id="date-result" class="result-container">선택된 날짜가 여기에 표시됩니다.</div>
    
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        // 캘린더 컴포넌트 설정
        if (window.CalendarComponent) {
          // 사용 가능한 날짜 생성 (현재부터 30일)
          const availableDates = (() => {
            const dates = [];
            const today = new Date();
            for (let i = 0; i < 30; i++) {
              const date = new Date(today);
              date.setDate(today.getDate() + i);
              dates.push(date.toISOString().split('T')[0]);
            }
            return dates;
          })();
          
          // 기본 캘린더 초기화
          const calendarConfig = {
            showCalendarCount: 2,
            selectMode: 'multiple',
            availableDates: availableDates,
            showControl: true
          };
          
          // 캘린더 등록 및 마운트
          const calendar = CalendarComponent.registerCalendar(calendarConfig);
          if (calendar) {
            calendar.mount('#calendar-container');
          }
          
          // 커스텀 태그 생성 함수
          function addCustomTagCalendar() {
            const container = document.getElementById('custom-calendar-container');
            container.innerHTML = ''; // 기존 캘린더 제거
            
            const calendar = document.createElement('my-calendar');
            calendar.id = "custom-tag-calendar";
            calendar.setAttribute('config', JSON.stringify({
              showCalendarCount: 1,
              selectMode: "single",
              availableDates: availableDates
            }));
            
            calendar.addEventListener('date-selected', (event) => {
              const resultElement = document.getElementById('date-result');
              if (resultElement) {
                resultElement.innerHTML = '<strong>선택된 날짜:</strong> ' + event.detail.date;
              }
              console.log('Date selected:', event.detail.date);
            });
            
            container.appendChild(calendar); // 컨테이너에 추가
          }
          
          // 커스텀 태그 생성 버튼 이벤트
          document.getElementById('create-custom-calendar').addEventListener('click', addCustomTagCalendar);
          
          // 페이지 로드 시 자동 생성
          setTimeout(addCustomTagCalendar, 500);
        }
      });
    </script>
  </div>
`;
        break;

      case 'todo':
        html += `
  <div class="container">
    <h2>Todo 컴포넌트</h2>
    <p>할 일 관리 컴포넌트입니다.</p>
    
    <div id="todo-container1"></div>
    <div data-todo-mount id="todo-container2"></div>
    
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        if (window.TodoComponent) {
          // 수동 마운트
          const todo = TodoComponent.registerTodo({
            todos: [
              { id: 1, text: '알파인 컴포넌트 만들기', completed: true },
              { id: 2, text: '컴포넌트 번들링하기', completed: false },
              { id: 3, text: '번들러 UI 완성하기', completed: false }
            ]
          });
          
          if (todo && todo.mount) {
            todo.mount('#todo-container1');
          }
          
          // data-todo-mount는 자동으로 마운트됨 (컴포넌트에서 처리)
        }
      });
    </script>
  </div>
`;
        break;

      // 여기에 다른 컴포넌트 추가 가능
      default:
        html += `
  <div class="container">
    <h2>${comp} 컴포넌트</h2>
    <p>${comp} 컴포넌트 예제입니다.</p>
  </div>
`;
    }
  });

  // HTML 파일 마무리
  html += `
  <script>
    // 컴포넌트 초기화 완료 메시지
    document.addEventListener('DOMContentLoaded', () => {
      console.log('모든 컴포넌트가 로드되었습니다.');
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(outputDir, 'example.html'), html);
}

// README 파일 생성
function createReadme(outputDir, components) {
  const readme = `# Alpine.js 컴포넌트 번들

이 패키지는 다음 Alpine.js 컴포넌트들을 포함하고 있습니다:

${components.map(comp => `- ${comp}`).join('\n')}

## 사용 방법

1. Alpine.js를 먼저 로드합니다:
\`\`\`html
<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
\`\`\`

2. 컴포넌트 스타일과 스크립트를 로드합니다:
\`\`\`html
<link rel="stylesheet" href="alpine-components.css">
<script src="alpine-components.js"></script>
\`\`\`

3. 필요한 경우 Remix Icon과 같은 추가 종속성을 로드합니다:
\`\`\`html
<link href="https://cdn.jsdelivr.net/npm/remixicon@3.2.0/fonts/remixicon.css" rel="stylesheet">
\`\`\`

4. 예제 사용법은 \`example.html\` 파일을 참조하세요.

## 컴포넌트별 사용법

${components.map(comp => {
    let usage = `### ${comp}\n\n`;
    switch (comp) {
      case 'toast':
        usage += `토스트 메시지 컴포넌트 사용법:
\`\`\`html
<my-toast id="toast-container"></my-toast>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    if (window.ToastComponent) {
      ToastComponent.registerToast();
    }
  });
  
  // 표시 방법 1: window.toast API
  window.toast.info('메시지');
  
  // 표시 방법 2: 이벤트 디스패치
  document.getElementById('toast-container').dispatchEvent(
    new CustomEvent('show-toast', {
      detail: { message: '메시지', type: 'info' }
    })
  );
</script>
\`\`\``;
        break;
      case 'counter':
        usage += `카운터 컴포넌트 사용법:
\`\`\`html
<my-counter start="5" step="1"></my-counter>

<script>
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
  }
</script>
\`\`\``;
        break;
      case 'dropdown':
        usage += `드롭다운 컴포넌트 사용법:
\`\`\`html
<my-dropdown label="메뉴 선택">
  <a href="#" class="dropdown-item">메뉴 항목 1</a>
  <a href="#" class="dropdown-item">메뉴 항목 2</a>
  <a href="#" class="dropdown-item">메뉴 항목 3</a>
</my-dropdown>
\`\`\``;
        break;
      case 'region-selector':
        usage += `지역 선택기 컴포넌트 사용법:
\`\`\`html
<region-selector id="region-selector"></region-selector>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    // 데이터 설정
    const cities = [
      { id: 'seoul', name: '서울', count: 458 },
      { id: 'busan', name: '부산', count: 357 }
    ];
    
    const districts = [
      { id: 'seoul-gangnam', cityId: 'seoul', name: '강남구', count: 87 },
      { id: 'seoul-jongno', cityId: 'seoul', name: '종로구', count: 43 }
    ];
    
    // 컴포넌트 초기화
    if (window.RegionSelectorComponent) {
      const controller = RegionSelectorComponent.registerRegionSelector({
        cities: cities,
        districts: districts
      });
      
      // 이벤트 처리
      document.getElementById('region-selector').addEventListener('region-selected', (e) => {
        console.log('선택된 지역:', e.detail);
      });
    }
  });
</script>
\`\`\``;
        break;
      case 'slider':
        usage += `슬라이더 컴포넌트 사용법:
\`\`\`html
<my-slider id="my-slider"></my-slider>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    if (window.SliderComponent) {
      SliderComponent.registerSlider();
      
      const slider = document.getElementById('my-slider');
      const config = {
        transitionType: "slide",
        autoplayEnabled: true,
        interval: 5,
        showIndicators: true,
        images: [
          { src: "이미지1.jpg", alt: "이미지 1", href: "#" },
          { src: "이미지2.jpg", alt: "이미지 2", href: "#" }
        ]
      };
      
      const newSlider = document.createElement('my-slider');
      newSlider.id = "my-slider";
      newSlider.setAttribute('config', JSON.stringify(config));
      
      slider.replaceWith(newSlider);
    }
  });
</script>
\`\`\``;
        break;
      case 'calendar':
        usage += `캘린더 컴포넌트 사용법:
\`\`\`html
<div id="calendar-container"></div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    if (window.CalendarComponent) {
      const calendarConfig = {
        showCalendarCount: 2,
        selectMode: 'multiple',
        availableDates: ["2025-03-01", "2025-03-02"] // 사용 가능한 날짜 목록
      };
      
      const calendar = CalendarComponent.registerCalendar(calendarConfig);
      if (calendar) {
        calendar.mount('#calendar-container');
      }
    }
  });
</script>
\`\`\`

또는 커스텀 태그 방식:
\`\`\`html
<my-calendar id="my-calendar" config='{"showCalendarCount": 1, "selectMode": "single"}'></my-calendar>

<script>
  document.getElementById('my-calendar').addEventListener('date-selected', (event) => {
    console.log('선택된 날짜:', event.detail.date);
  });
</script>
\`\`\``;
        break;
      case 'todo':
        usage += `할 일 관리 컴포넌트 사용법:
\`\`\`html
<!-- 수동 마운트 -->
<div id="todo-container"></div>

<!-- 자동 마운트 -->
<div data-todo-mount></div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    if (window.TodoComponent) {
      // 초기 할 일 목록 설정
      const todo = TodoComponent.registerTodo({
        todos: [
          { id: 1, text: '할 일 1', completed: false },
          { id: 2, text: '할 일 2', completed: true }
        ]
      });
      
      // 수동 마운트
      if (todo && todo.mount) {
        todo.mount('#todo-container');
      }
    }
  });
</script>
\`\`\``;
        break;
      default:
        usage += `${comp} 컴포넌트 사용법에 대한 자세한 내용은 소스 코드를 참조하세요.\n`;
    }
    return usage;
  }).join('\n\n')}

## 라이센스

이 컴포넌트 번들은 MIT 라이센스로 제공됩니다.
`;

  fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
}

// ZIP 파일 생성
async function zipBundle(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    output.on('close', () => resolve());
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// 번들 파일 가져오기
function getBundleFile(bundleId) {
  const zipPath = path.join(tempDir, `${bundleId}.zip`);
  if (fs.existsSync(zipPath)) {
    return zipPath;
  }
  return null;
}

// 컴포넌트 목록 가져오기
function getComponentsList() {
  const bundlesDir = path.join(__dirname, '../../bundles');

  try {
    const directories = fs.readdirSync(bundlesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => {
        const name = dirent.name;
        const distPath = path.join(bundlesDir, name, 'dist');
        const hasBundle = fs.existsSync(distPath) &&
          fs.existsSync(path.join(distPath, `${name}-bundle.js`));

        const infoPath = path.join(bundlesDir, name, 'component-info.json');
        let info = {
          name: name,
          description: `${name} 컴포넌트`,
          version: '1.0.0',
          category: 'UI',
          tags: [name],
          dependencies: []
        };

        if (fs.existsSync(infoPath)) {
          try {
            const userInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
            info = { ...info, ...userInfo };
          } catch (e) {
            console.error(`컴포넌트 정보 파일 파싱 오류 (${name}):`, e);
          }
        }

        return {
          id: name,
          ...info,
          available: hasBundle
        };
      })
      .filter(comp => comp.available);

    // 나중을 위해 의존성 자동 감지 추가
    directories.forEach(comp => {
      if (comp.id === 'toast') {
        comp.dependencies.push('remixicon');
      }
    });

    return directories;
  } catch (error) {
    console.error('컴포넌트 목록 조회 오류:', error);
    return [];
  }
}

module.exports = {
  createBundle,
  getBundleFile,
  getComponentsList
};