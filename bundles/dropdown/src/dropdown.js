// src/dropdown.js
import dropdownTemplate from './dropdown.html';
import './dropdown.scss';

// 기본 옵션 설정 - 빈 배열
const DEFAULT_OPTIONS = [];

export function registerDropdown(config = {}) {
    if (!window.Alpine) {
        console.error('Alpine.js is not loaded. Please load Alpine.js first.');
        return null;
    }

    // 커스텀 dropdown 태그 정의
    if (typeof customElements != 'undefined' && !customElements.get('my-dropdown')) {
        class DropdownElement extends HTMLElement {
            connectedCallback() {
                // option 태그를 처리하여 옵션 목록 구성
                let optionsFromChildren = [];
                const selectedValue = this.getAttribute('selected');
                let defaultOption = null;

                // 자식 노드에서 option 태그 처리
                const optionElements = this.querySelectorAll('option');
                if (optionElements.length > 0) {
                    optionsFromChildren = Array.from(optionElements).map(option => {
                        const name = option.textContent;
                        const value = option.getAttribute('value') || name;
                        const icon = option.getAttribute('icon') || 'ri-file-list-line';

                        const optionObj = { name, value, icon };

                        // 모든 추가 속성을 객체에 추가
                        Array.from(option.attributes).forEach(attr => {
                            // name, value, icon 외의 모든 속성 처리
                            if (!['value', 'icon'].includes(attr.name)) {
                                optionObj[attr.name] = attr.value;
                            }
                        });

                        // selected 속성으로 기본 선택 항목 확인
                        if (selectedValue && (selectedValue === value || selectedValue === name)) {
                            defaultOption = optionObj;
                        }

                        return optionObj;
                    });

                    // 첫 번째 option을 기본값으로 설정 (만약 selected가 없으면)
                    if (!defaultOption && optionsFromChildren.length > 0) {
                        defaultOption = optionsFromChildren[0];
                    }

                    // option 태그 삭제 (처리 완료했으므로)
                    optionElements.forEach(option => option.remove());
                }

                // 태그가 문서에 연결될 때 내용 설정
                this.innerHTML = dropdownTemplate;

                // 옵션 속성 처리
                const optionsAttr = this.getAttribute('options');
                const selectedAttr = this.getAttribute('selected');
                const positionAttr = this.getAttribute('position');
                const onSelectAttr = this.getAttribute('on-select');
                const configAttr = this.getAttribute('config');

                // 기본 설정 (빈 배열로 시작)
                let localConfig = {
                    options: optionsFromChildren.length > 0 ? optionsFromChildren : [...DEFAULT_OPTIONS],
                    defaultOption: defaultOption || null
                };

                // config 속성이 있으면 파싱해서 적용
                if (configAttr) {
                    try {
                        const parsedConfig = JSON.parse(configAttr);
                        Object.assign(localConfig, parsedConfig);
                    } catch (e) {
                        console.error('Invalid config attribute:', e);
                    }
                }

                // 개별 속성으로 덮어쓰기 - 옵션
                if (optionsAttr) {
                    try {
                        localConfig.options = JSON.parse(optionsAttr);
                    } catch (e) {
                        console.error('Invalid options attribute:', e);
                    }
                }

                // 개별 속성으로 덮어쓰기 - 선택된 옵션
                if (selectedAttr && optionsFromChildren.length === 0) {
                    try {
                        // 직접 JSON으로 입력한 경우
                        localConfig.defaultOption = JSON.parse(selectedAttr);
                    } catch (e) {
                        // 문자열로 이름이나 값을 입력한 경우
                        const selectedOption = localConfig.options.find(
                            opt => opt.name === selectedAttr || opt.value === selectedAttr
                        );
                        if (selectedOption) {
                            localConfig.defaultOption = selectedOption;
                        }
                    }
                }

                // 개별 속성으로 덮어쓰기 - 위치
                if (positionAttr) {
                    localConfig.position = positionAttr;
                }

                // on-select 속성 처리
                if (onSelectAttr) {
                    try {
                        // 전역 함수 참조 찾기
                        if (typeof window[onSelectAttr] === 'function') {
                            localConfig.onSelect = window[onSelectAttr];
                        } else {
                            console.warn(`함수 '${onSelectAttr}'를 찾을 수 없습니다.`);
                        }
                    } catch (e) {
                        console.error('Error setting onSelect callback:', e);
                    }
                }

                // 기본 선택 값이 없고 옵션이 있는 경우 첫 번째 옵션을 선택
                if (!localConfig.defaultOption && localConfig.options && localConfig.options.length > 0) {
                    localConfig.defaultOption = localConfig.options[0];
                }

                // Alpine 컴포넌트 초기화를 위해 데이터 속성 추가
                this.setAttribute('x-data', 'dropdown');

                // Alpine 데이터 객체에 localConfig 전달
                if (this.id) {
                    window.Alpine.store('dropdownConfig_' + this.id, localConfig);
                } else {
                    // ID가 없는 경우 임의로 생성
                    const randomId = 'dropdown_' + Math.random().toString(36).substring(2, 11);
                    this.id = randomId;
                    window.Alpine.store('dropdownConfig_' + randomId, localConfig);
                }
            }

            disconnectedCallback() {
                // 태그가 문서에서 제거될 때 정리 작업
                if (this.id && window.Alpine && window.Alpine.store) {
                    try {
                        // 안전하게 store에서 빈 객체로 설정 (null 대신)
                        const storeKey = 'dropdownConfig_' + this.id;
                        if (typeof window.Alpine.store(storeKey) !== 'undefined') {
                            window.Alpine.store(storeKey, {});
                        }
                    } catch (e) {
                        console.warn('Error cleaning up dropdown:', e);
                    }
                }
            }

            /**
             * 새로운 옵션 추가
             * @param {Object} option - 추가할 옵션 객체 {name, icon, value, ...}
             */
            addOption(option) {
                if (!option || !option.name) return false;

                // 현재 설정 가져오기
                const storeKey = 'dropdownConfig_' + this.id;
                const config = window.Alpine.store(storeKey);

                if (config) {
                    // 중복 체크
                    const isDuplicate = config.options.some(opt =>
                        (opt.value && opt.value === option.value) ||
                        (opt.name && opt.name === option.name)
                    );

                    if (isDuplicate) {
                        console.warn('중복된 옵션:', option);
                        return false;
                    }

                    // 새 드롭다운 생성 및 교체
                    const newDropdown = document.createElement('my-dropdown');
                    newDropdown.id = this.id;

                    // 새 옵션 목록 생성
                    const newOptions = [...config.options, option];

                    // 새 설정 적용
                    newDropdown.setAttribute('config', JSON.stringify({
                        options: newOptions,
                        defaultOption: config.defaultOption
                    }));

                    // 이벤트 핸들러가 있으면 직접 설정 (JSON으로 직렬화 불가)
                    if (config.onSelect) {
                        setTimeout(() => {
                            window.Alpine.store('dropdownConfig_' + newDropdown.id, {
                                ...JSON.parse(newDropdown.getAttribute('config')),
                                onSelect: config.onSelect
                            });
                        }, 0);
                    }

                    // 기존 요소 교체
                    this.replaceWith(newDropdown);
                    return true;
                }
                return false;
            }

            /**
             * 옵션 제거
             * @param {string|number} identifier - 제거할 옵션의 value, name 또는 인덱스
             */
            removeOption(identifier) {
                const storeKey = 'dropdownConfig_' + this.id;
                const config = window.Alpine.store(storeKey);

                if (config) {
                    // 옵션 복사
                    const options = [...config.options];
                    let newOptions = [];
                    let removed = false;

                    if (typeof identifier === 'number') {
                        // 인덱스로 제거
                        if (identifier >= 0 && identifier < options.length) {
                            newOptions = [
                                ...options.slice(0, identifier),
                                ...options.slice(identifier + 1)
                            ];
                            removed = true;
                        }
                    } else {
                        // value 또는 name으로 제거
                        newOptions = options.filter(option =>
                            option.value !== identifier && option.name !== identifier
                        );
                        removed = newOptions.length < options.length;
                    }

                    if (removed) {
                        // 새 드롭다운 생성
                        const newDropdown = document.createElement('my-dropdown');
                        newDropdown.id = this.id;

                        // 선택된 항목 체크
                        let selectedOption = config.defaultOption;

                        // 선택된 항목이 제거됐는지 확인
                        const selectedRemoved = config.defaultOption && !newOptions.some(opt =>
                            (opt.value === config.defaultOption.value) ||
                            (opt.name === config.defaultOption.name)
                        );

                        // 선택된 항목이 제거됐으면 첫 번째 항목 선택
                        if (selectedRemoved && newOptions.length > 0) {
                            selectedOption = newOptions[0];
                        } else if (newOptions.length === 0) {
                            selectedOption = null;
                        }

                        // 새 설정 적용
                        newDropdown.setAttribute('config', JSON.stringify({
                            options: newOptions,
                            defaultOption: selectedOption
                        }));

                        // 이벤트 핸들러가 있으면 직접 설정
                        if (config.onSelect) {
                            setTimeout(() => {
                                window.Alpine.store('dropdownConfig_' + newDropdown.id, {
                                    ...JSON.parse(newDropdown.getAttribute('config')),
                                    onSelect: config.onSelect
                                });
                            }, 0);
                        }

                        // 기존 요소 교체
                        this.replaceWith(newDropdown);
                        return true;
                    }
                }
                return false;
            }

            /**
             * 특정 옵션 업데이트
             * @param {string|number} identifier - 업데이트할 옵션의 value, name 또는 인덱스
             * @param {Object} newProps - 업데이트할 속성 {name, icon, value, ...}
             */
            updateOption(identifier, newProps) {
                if (!newProps || typeof newProps !== 'object') return false;

                const storeKey = 'dropdownConfig_' + this.id;
                const config = window.Alpine.store(storeKey);

                if (config) {
                    // 옵션 복사
                    const options = [...config.options];
                    let updated = false;
                    let targetIndex = -1;

                    if (typeof identifier === 'number') {
                        // 인덱스로 업데이트
                        if (identifier >= 0 && identifier < options.length) {
                            targetIndex = identifier;
                            updated = true;
                        }
                    } else {
                        // value 또는 name으로 업데이트
                        targetIndex = options.findIndex(option =>
                            option.value === identifier || option.name === identifier
                        );
                        updated = targetIndex !== -1;
                    }

                    if (updated) {
                        // 특정 옵션 업데이트
                        const oldOption = options[targetIndex];
                        options[targetIndex] = { ...oldOption, ...newProps };

                        // 새 드롭다운 생성
                        const newDropdown = document.createElement('my-dropdown');
                        newDropdown.id = this.id;

                        // 선택된 항목이 업데이트된 경우 처리
                        let selectedOption = config.defaultOption;
                        if (config.defaultOption &&
                            (config.defaultOption.value === oldOption.value ||
                                config.defaultOption.name === oldOption.name)) {
                            selectedOption = options[targetIndex];
                        }

                        // 새 설정 적용
                        newDropdown.setAttribute('config', JSON.stringify({
                            options: options,
                            defaultOption: selectedOption
                        }));

                        // 이벤트 핸들러가 있으면 직접 설정
                        if (config.onSelect) {
                            setTimeout(() => {
                                window.Alpine.store('dropdownConfig_' + newDropdown.id, {
                                    ...JSON.parse(newDropdown.getAttribute('config')),
                                    onSelect: config.onSelect
                                });
                            }, 0);
                        }

                        // 기존 요소 교체
                        this.replaceWith(newDropdown);
                        return true;
                    }
                }
                return false;
            }

            /**
             * 모든 옵션 업데이트
             * @param {Array} newOptions - 새로운 옵션 배열
             */
            updateOptions(newOptions) {
                if (!Array.isArray(newOptions)) return false;

                const storeKey = 'dropdownConfig_' + this.id;
                const config = window.Alpine.store(storeKey);

                if (config) {
                    // 새 드롭다운 생성
                    const newDropdown = document.createElement('my-dropdown');
                    newDropdown.id = this.id;

                    // 선택된 항목 확인
                    let selectedOption = config.defaultOption;

                    // 선택된 항목이 새 목록에 있는지 확인
                    const selectedExists = config.defaultOption && newOptions.some(opt =>
                        (opt.value && opt.value === config.defaultOption.value) ||
                        (opt.name && opt.name === config.defaultOption.name)
                    );

                    // 선택된 항목이 없으면 첫 번째 항목 선택
                    if (!selectedExists && newOptions.length > 0) {
                        selectedOption = newOptions[0];
                    } else if (newOptions.length === 0) {
                        selectedOption = null;
                    }

                    // 새 설정 적용
                    newDropdown.setAttribute('config', JSON.stringify({
                        options: newOptions,
                        defaultOption: selectedOption
                    }));

                    // 이벤트 핸들러가 있으면 직접 설정
                    if (config.onSelect) {
                        setTimeout(() => {
                            window.Alpine.store('dropdownConfig_' + newDropdown.id, {
                                ...JSON.parse(newDropdown.getAttribute('config')),
                                onSelect: config.onSelect
                            });
                        }, 0);
                    }

                    // 기존 요소 교체
                    this.replaceWith(newDropdown);
                    return true;
                }
                return false;
            }

            /**
             * 현재 옵션 목록 가져오기
             * @returns {Array} 옵션 배열
             */
            getOptions() {
                const storeKey = 'dropdownConfig_' + this.id;
                const config = window.Alpine.store(storeKey);
                return config && config.options ? [...config.options] : [];
            }

            /**
             * 선택된 옵션 설정
             * @param {Object|string} option - 선택할 옵션 객체 또는 value/name
             */
            setSelectedOption(option) {
                const storeKey = 'dropdownConfig_' + this.id;
                const config = window.Alpine.store(storeKey);

                if (!config) return false;

                // 찾을 옵션 결정
                let selectedOption = null;

                if (typeof option === 'string') {
                    // 문자열인 경우 value 또는 name으로 옵션 찾기
                    selectedOption = config.options.find(opt =>
                        opt.value === option || opt.name === option
                    );
                } else if (option && typeof option === 'object') {
                    // 객체인 경우 직접 사용
                    selectedOption = option;
                }

                if (selectedOption) {
                    // 새 드롭다운 생성
                    const newDropdown = document.createElement('my-dropdown');
                    newDropdown.id = this.id;

                    // 새 설정 적용
                    newDropdown.setAttribute('config', JSON.stringify({
                        options: config.options,
                        defaultOption: selectedOption
                    }));

                    // 이벤트 핸들러가 있으면 직접 설정
                    if (config.onSelect) {
                        setTimeout(() => {
                            window.Alpine.store('dropdownConfig_' + newDropdown.id, {
                                ...JSON.parse(newDropdown.getAttribute('config')),
                                onSelect: config.onSelect
                            });
                        }, 0);
                    }

                    // 기존 요소 교체
                    this.replaceWith(newDropdown);
                    return true;
                }

                return false;
            }
        }

        customElements.define('my-dropdown', DropdownElement);
    }

    window.Alpine.data('dropdown', () => {
        // Alpine 컴포넌트의 기본 설정
        return {
            init() {
                // 드롭다운 요소 찾기
                const dropdownEl = this.$el.closest('my-dropdown');
                if (dropdownEl && dropdownEl.id) {
                    const storeConfig = window.Alpine.store('dropdownConfig_' + dropdownEl.id);
                    if (storeConfig) {
                        // 설정 복사
                        this.options = storeConfig.options || [];
                        this.selectedOption = storeConfig.defaultOption || null;
                        this.onSelect = storeConfig.onSelect;
                    }
                }
            },
            isOpen: false,
            options: [],
            selectedOption: null,
            onSelect: null,

            // 옵션이 없을 때 표시할 기본 값을 반환하는 getter
            get displayName() {
                return this.selectedOption ? this.selectedOption.name : 'Select option';
            },

            get displayIcon() {
                return this.selectedOption ? this.selectedOption.icon : 'ri-user-3-line';
            },

            toggle() {
                this.isOpen = !this.isOpen;
            },

            selectOption(option) {
                this.selectedOption = option;
                this.isOpen = false;

                // 콜백 호출
                if (typeof this.onSelect === 'function') {
                    this.onSelect(option);
                }

                // 커스텀 이벤트 발생
                this.$el.dispatchEvent(new CustomEvent('option-selected', {
                    detail: { option },
                    bubbles: true
                }));
            }
        };
    });

    const controller = {
        mount(el) {
            if (typeof el == 'string') { el = document.querySelector(el); }

            if (el) {
                el.innerHTML = dropdownTemplate;
            } else {
                console.error('Cannot find target element.', el);
            }
        },

        getTemplate() { return dropdownTemplate; }
    };

    return controller;
}

// Auto initialization after the document is fully loaded
if (typeof document != 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) {
            // 기본 드롭다운 컴포넌트 등록
            registerDropdown();

            // 기존 data-dropdown-mount 속성 초기화
            document.querySelectorAll('[data-dropdown-mount]').forEach(el => {
                const dropdown = registerDropdown();
                if (dropdown) { dropdown.mount(el); }
            });

            // 커스텀 태그 정의 확인
            if (typeof customElements != 'undefined') {
                customElements.whenDefined('my-dropdown').then(() => {
                    console.log('my-dropdown custom element defined');
                });
            }
        }
    });
}

window.DropdownComponent = { registerDropdown };