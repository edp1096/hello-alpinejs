// src/region-selector.js
import regionSelectorTemplate from './region-selector.html';
import './region-selector.scss';

// 전역 변수로 만들어 모든 곳에서 접근 가능하게 함
let RegionSelectorElement;

export function registerRegionSelector(config = {}) {
    if (!window.Alpine) {
        console.error('Alpine.js is not loaded. Please load Alpine.js first.');
        return null;
    }

    // 커스텀 element 클래스 정의 - 전역 변수에 할당
    RegionSelectorElement = class extends HTMLElement {
        connectedCallback() {
            // 속성에서 설정 가져오기
            let localConfig = { ...config };

            // 도시/지역 데이터 속성 처리
            const citiesAttr = this.getAttribute('cities');
            const districtsAttr = this.getAttribute('districts');
            const selectorIdAttr = this.getAttribute('selector-id');
            const placeholderText = this.getAttribute('placeholder-text');

            if (citiesAttr) {
                try {
                    localConfig.cities = JSON.parse(citiesAttr);
                } catch (e) {
                    console.error('Failed to parse cities attribute:', e);
                }
            }

            if (districtsAttr) {
                try {
                    localConfig.districts = JSON.parse(districtsAttr);
                } catch (e) {
                    console.error('Failed to parse districts attribute:', e);
                }
            }

            if (selectorIdAttr) {
                localConfig.selectorId = selectorIdAttr;
            } else if (this.id) {
                localConfig.selectorId = this.id; // ID 속성이 있으면 selector-id로 사용
            }

            if (placeholderText) {
                localConfig.placeholderText = placeholderText;
            }

            // 템플릿 설정
            this.innerHTML = regionSelectorTemplate;

            // // 디버그 로그
            // console.log(`Region selector initialized: ID=${localConfig.selectorId || 'none'}`);

            // Alpine 데이터 객체에 localConfig 전달
            if (this.id) {
                window.Alpine.store('regionSelectorConfig_' + this.id, localConfig);
            }

            // 이벤트 리스너 설정
            this.addEventListener('region-selected', (event) => {
                if (typeof this.onRegionSelected == 'function') {
                    this.onRegionSelected(event.detail);
                }
            });
        }

        disconnectedCallback() {
            // 태그가 문서에서 제거될 때 정리 작업
            if (this.id) {
                window.Alpine.store('regionSelectorConfig_' + this.id, null);
            }
        }

        // 선택된 지역을 가져오는 메서드 (외부에서 접근 가능)
        getSelectedRegion() {
            const alpine = this.__x;
            if (alpine) {
                return {
                    city: alpine.$data.selectedCity,
                    district: alpine.$data.selectedDistrict
                };
            }
            return { city: null, district: null };
        }

        // 선택된 지역을 설정하는 메서드 (외부에서 접근 가능)
        setSelectedRegion(city, district) {
            const alpine = this.__x;
            if (alpine) {
                alpine.$data.selectedCity = city;
                alpine.$data.selectedDistrict = district;
            }
        }
    };

    // 커스텀 요소 등록 함수 - 필요시 직접 호출
    const registerCustomElement = () => {
        if (typeof customElements != 'undefined' && !customElements.get('region-selector')) {
            customElements.define('region-selector', RegionSelectorElement);
            // console.log('region-selector custom element defined');
            return true;
        }
        return false;
    };

    registerCustomElement(); // 바로 등록 시도

    window.Alpine.data('regionSelector', () => ({
        config: config,
        isOpen: false,
        selectedCity: null,
        selectedDistrict: null,
        defaultPlaceHolderText: '지역 선택',

        // 지역 데이터는 config에서 가져옴
        get cities() {
            // 요소의 ID를 확인하고 해당 설정 가져오기
            if (this.$el && this.$el.closest('region-selector') && this.$el.closest('region-selector').id) {
                const customConfig = window.Alpine.store('regionSelectorConfig_' + this.$el.closest('region-selector').id);
                if (customConfig && customConfig.cities) {
                    return customConfig.cities;
                }
            }

            return this.config.cities || [];
        },

        get districts() {
            // 요소의 ID를 확인하고 해당 설정 가져오기
            if (this.$el && this.$el.closest('region-selector') && this.$el.closest('region-selector').id) {
                const customConfig = window.Alpine.store('regionSelectorConfig_' + this.$el.closest('region-selector').id);
                if (customConfig && customConfig.districts) {
                    return customConfig.districts;
                }
            }

            return this.config.districts || [];
        },

        // 선택기 ID를 config에서 가져옴
        get selectorId() {
            // 요소의 ID를 확인하고 해당 설정 가져오기
            if (this.$el && this.$el.closest('region-selector') && this.$el.closest('region-selector').id) {
                const customConfig = window.Alpine.store('regionSelectorConfig_' + this.$el.closest('region-selector').id);
                if (customConfig && customConfig.selectorId) {
                    return customConfig.selectorId;
                }

                return this.$el.closest('region-selector').id; // selector-id 속성이 없으면 요소의 id를 반환
            }

            return this.config.selectorId || '';
        },

        // 플레이스홀더 텍스트 가져오기 (사용자 정의 가능)
        get placeholderText() {
            // 요소의 ID를 확인하고 해당 설정 가져오기
            if (this.$el && this.$el.closest('region-selector') && this.$el.closest('region-selector').id) {
                const customConfig = window.Alpine.store('regionSelectorConfig_' + this.$el.closest('region-selector').id);
                if (customConfig && customConfig.placeholderText) {
                    return customConfig.placeholderText;
                }
            }

            const customConfig = window.Alpine.store('regionSelectorConfig_' + this.$el.closest('region-selector').id);

            return this.defaultPlaceHolderText;
        },

        // 현재 선택된 지역 표시 텍스트
        get displayText() {
            if (this.selectedCity && this.selectedDistrict) {
                return `${this.selectedCity.name} > ${this.selectedDistrict.name.replace(this.selectedCity.name + ' ', '')}`;
            }
            return this.placeholderText;
        },

        // 선택된 시/도에 맞는 군/구 필터링
        get filteredDistricts() {
            if (!this.selectedCity) return [];
            return this.districts.filter(district => district.cityId == this.selectedCity.id);
        },

        // 드롭다운 토글
        toggleDropdown() {
            this.isOpen = !this.isOpen;
        },

        // 드롭다운 닫기
        closeDropdown() {
            this.isOpen = false;
        },

        // 시/도 선택
        selectCity(city) {
            this.selectedCity = city;
            // 시/도만 선택하고 군/구는 선택하지 않은 상태로 초기화
            this.selectedDistrict = null;

            // 이벤트 발생
            const selectedEvent = new CustomEvent('region-selected', {
                detail: {
                    city: this.selectedCity,
                    district: null,
                    selectorId: this.selectorId
                },
                bubbles: true
            });
            this.$el.dispatchEvent(selectedEvent);

            // 콜백 함수가 있다면 호출
            if (typeof this.config.onSelect == 'function') {
                this.config.onSelect({
                    city: this.selectedCity,
                    district: null,
                    selectorId: this.selectorId
                });
            }
        },

        // 군/구 선택
        selectDistrict(district) {
            this.selectedDistrict = district;
            this.closeDropdown();

            // 선택된 지역 정보를 이벤트로 발생시킴
            const selectedEvent = new CustomEvent('region-selected', {
                detail: {
                    city: this.selectedCity,
                    district: district,
                    selectorId: this.selectorId
                },
                bubbles: true
            });
            this.$el.dispatchEvent(selectedEvent);

            // 콜백 함수가 있다면 호출
            if (typeof this.config.onSelect == 'function') {
                this.config.onSelect({
                    city: this.selectedCity,
                    district: district,
                    selectorId: this.selectorId
                });
            }
        },

        // 전체 지역 선택
        selectAllRegions() {
            this.selectedCity = null;
            this.selectedDistrict = null;
            this.closeDropdown();

            // 전체 지역 선택 이벤트 발생
            const selectedEvent = new CustomEvent('region-selected', {
                detail: {
                    city: null,
                    district: null,
                    selectorId: this.selectorId
                },
                bubbles: true
            });
            this.$el.dispatchEvent(selectedEvent);

            // 콜백 함수가 있다면 호출
            if (typeof this.config.onSelect == 'function') {
                this.config.onSelect({
                    city: null,
                    district: null,
                    selectorId: this.selectorId
                });
            }
        },

        init() {
            // 초기 상태 설정
            if (this.config) {
                if (this.config.selectedCity) {
                    this.selectedCity = this.config.selectedCity;
                }
                if (this.config.selectedDistrict) {
                    this.selectedDistrict = this.config.selectedDistrict;
                }
            }

            // 컴포넌트 요소의 Alpine 인스턴스 설정
            if (this.$el && this.$el.closest('region-selector')) {
                this.$el.closest('region-selector').__x = this.$data;
            }
        }
    }));

    return {
        mount(el) {
            if (typeof el == 'string') {
                el = document.querySelector(el);
            }

            if (el) {
                el.innerHTML = regionSelectorTemplate;
            } else {
                console.error('Cannot find target element.', el);
            }
        },

        getTemplate() {
            return regionSelectorTemplate;
        },

        // 커스텀 엘리먼트 등록 메서드 노출
        registerCustomElement
    };
}

// 전역 객체 등록
window.RegionSelectorComponent = { registerRegionSelector };