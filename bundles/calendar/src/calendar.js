// src/calendar.js
import calendarTemplate from './calendar.html';
import './calendar.scss';

let CALENDAR_WEEKDAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

let CALENDAR_WEEKDAYS_SHORT = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thr",
    "Fri",
    "Sat"
];

let CALENDAR_MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

const CURRENT_MONTH = true;
const OTHER_MONTH = false;

function buildEntries(year, month) {
    const daysInMonth = getDaysInMonth(year, month);
    const entries = [];

    for (let i = 1; i <= daysInMonth; i++) {
        entries.push(buildEntry(year, month, i, CURRENT_MONTH));
    }

    return entries;
}

function buildEntry(year, month, date, isCurrentMonth) {
    const timestamp = new Date(year, month, date);

    const calendarEntry = {
        id: timestamp.getTime(),
        year: timestamp.getFullYear(),
        month: timestamp.getMonth(),
        monthName: CALENDAR_MONTHS[timestamp.getMonth()],
        date: timestamp.getDate(),
        day: timestamp.getDay(),
        dayName: CALENDAR_WEEKDAYS[timestamp.getDay()],
        isToday: getIsToday(timestamp),
        isCurrentMonth: isCurrentMonth,
        isOtherMonth: !isCurrentMonth,
        isWeekday: getIsWeekday(timestamp.getDay()),
        isSaturday: getIsSaturday(timestamp.getDay()),
        isSunday: getIsSunday(timestamp.getDay())
    };

    return calendarEntry;
}

function buildGrid(entries) {
    const grid = {
        headers: CALENDAR_WEEKDAYS.slice(),
        headersAbbreviated: CALENDAR_WEEKDAYS_SHORT.slice(),
        entries: entries.slice(),
        weeks: []
    };

    for (; ;) {
        const entry = grid.entries.at(0);
        if (getIsFirstEntryOfWeek(entry)) { break; }
        grid.entries.unshift(buildEntry(entry.year, entry.month, (entry.date - 1), OTHER_MONTH));
    }

    for (; ;) {
        const entry = grid.entries.at(-1);
        if (getIsLastEntryOfWeek(entry)) { break; }
        grid.entries.push(buildEntry(entry.year, entry.month, (entry.date + 1), OTHER_MONTH));
    }

    // Slice each entries as array per weeks
    for (let i = 0; i < grid.entries.length; i += 7) {
        grid.weeks.push(grid.entries.slice(i, (i + 7)));
    }

    return grid;
}

function getDaysInMonth(year, month) {
    const lastDayOfMonth = new Date(year, (month + 1), 0);
    return lastDayOfMonth.getDate();
}

function getIsFirstEntryOfWeek(entry) {
    return (entry.day == 0);
}

function getIsLastEntryOfWeek(entry) {
    return (entry.day == 6);
}

function getIsToday(date) {
    const timestamp = new Date();
    const isToday = (
        (date.getFullYear() == timestamp.getFullYear()) &&
        (date.getMonth() == timestamp.getMonth()) &&
        (date.getDate() == timestamp.getDate())
    );

    return isToday;
}

function getIsWeekday(day) {
    return !getIsWeekend(day);
}

function getIsWeekend(day) {
    return ((day == 0) || (day == 6));
}

function getIsSaturday(day) {
    return (day == 6);
}

function getIsSunday(day) {
    return (day == 0);
}

function getYMD(year, month, date) {
    month = (month + 1).toString().padStart(2, '0');
    date = date.toString().padStart(2, '0');
    const ymd = `${year}-${month}-${date}`;

    return ymd;
}

function getYmdFromEntry(entry) {
    const ymd = getYMD(entry.year, entry.month, entry.date);
    return ymd;
}

const CalendarEntryController = (initialYear, initialMonth) => {
    let showCalendarCount = 1

    const timestamp = new Date();
    const year = (initialYear ?? timestamp.getFullYear());
    const month = (initialMonth ?? timestamp.getMonth());
    // const monthName = CALENDAR_MONTHS[month];

    // const entries = buildEntries(year, month);
    // const grid = buildGrid(entries);

    let years = []
    let months = []
    let monthNames = []
    let grids = []
    for (let i = 0; i < showCalendarCount; i++) {
        const timestamp_appender = new Date(year, month + (i))
        const years_appender = timestamp_appender.getFullYear()
        const months_appender = timestamp_appender.getMonth()
        const monthNames_appender = CALENDAR_MONTHS[months_appender]

        years.push(years_appender)
        months.push(months_appender)
        monthNames.push(monthNames_appender)

        const entries_appender = buildEntries(years_appender, months_appender)
        grids.push(buildGrid(entries_appender))
    }

    const controller = {
        moreMonthCount: showCalendarCount,

        year: year,
        month: month,
        // monthName: monthName,
        // entries: entries,
        // grid: grid,

        years: years,
        months: months,
        monthNames: monthNames,
        grids: grids,

        // 모든 월 이름 반환 (드롭다운용)
        getAllMonths() {
            return CALENDAR_MONTHS;
        },

        // 연도 범위 생성 (드롭다운용)
        getYearRange() {
            const currentYear = new Date().getFullYear();
            const startYear = currentYear - 10; // 현재 연도로부터 10년 전
            const endYear = currentYear + 10; // 현재 연도로부터 10년 후
            const years = [];
            
            for (let year = startYear; year <= endYear; year++) {
                years.push(year);
            }
            
            return years;
        },

        // 특정 연도와 월로 이동 (드롭다운에서 사용)
        gotoMonthYear(year, month, calendarIndex = 0) {
            // 선택된 달력 인덱스를 기준으로 기준 월 계산
            const baseMonth = month - calendarIndex;
            this.gotoDate(new Date(year, baseMonth, 1));
        },

        gotoDate(target) {
            this.year = target.getFullYear();
            this.month = target.getMonth();
            this.monthName = CALENDAR_MONTHS[this.month];
            this.entries = buildEntries(this.year, this.month);
            this.grid = buildGrid(this.entries);

            this.years = []
            this.months = []
            this.monthNames = []
            this.grids = []
            for (let i = 0; i < this.moreMonthCount; i++) {
                const timestamp_appender = new Date(this.year, this.month + i)
                const years_appender = timestamp_appender.getFullYear()
                const months_appender = timestamp_appender.getMonth()
                const monthNames_appender = CALENDAR_MONTHS[months_appender]

                this.years.push(years_appender)
                this.months.push(months_appender)
                this.monthNames.push(monthNames_appender)

                const entries_appender = buildEntries(years_appender, months_appender)
                this.grids.push(buildGrid(entries_appender))
            }
        },
        gotoNextMonth() { this.gotoDate(new Date(this.year, (this.month + 1), 1)); },
        gotoToday() { this.gotoDate(new Date()); },
        gotoPrevMonth() { this.gotoDate(new Date(this.year, (this.month - 1), 1)); },
        gotoYear(year, month) { this.gotoDate(new Date(year, (month || 0), 1)); }
    }

    return controller;
};

const CalendarModuleController = (config = {}) => {
    const controller = {
        showCalendarCount: config.showCalendarCount || 1,
        selectMode: config.selectMode || "single",
        selectedEntry: null,
        selectedDate: null,
        selectedDates: [],
        availables: config.availableDates || [],
        showControl: config.showControl || false,

        async init() {
            this.$watch("selectMode", () => { this.clearSelection(); });
            // Random available dates for demo
            if (this.availables[0] == "random") {
                this.setAvailables(this.createRandomAvailableDates());
            }

            if (this.showCalendarCount > 1) {
                await this.$nextTick();
                this.updateShowMonthCount(this.showCalendarCount)
            }
        },

        createRandomAvailableDates() {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();

            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 2, 0);

            const allDates = [];
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                allDates.push(`${y}-${m}-${day}`);
            }

            const availableDates = [...allDates];
            const numDatesToRemove = Math.floor(Math.random() * (allDates.length / 2));
            for (let i = 0; i < numDatesToRemove; i++) {
                const randomIndex = Math.floor(Math.random() * availableDates.length);
                availableDates.splice(randomIndex, 1);
            }

            return availableDates;
        },
        changeAvailableDates() {
            if (this.availables.length > 0) {
                this.setAvailables([]);
            } else {
                this.setAvailables(this.createRandomAvailableDates());
            }
            this.clearSelection();
        },
        getToday() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const date = String(now.getDate()).padStart(2, '0');

            return {
                year: year,
                month: month,
                date: date
            };
        },
        clearSelection() {
            this.selectedEntry = null;
            this.selectedDate = null;
            this.selectedDates = [];
        },
        setSelectMode(mode) { this.selectMode = mode; },
        updateShowMonthCount(count) {
            if (count <= 0) { count = 1 }
            this.getCalendarDataObject().moreMonthCount = count
            this.clearSelection()
            this.jumpToYearCurrentMonth(this.getCalendarDataObject().year)
        },
        setAvailables(availables) { this.availables = availables; },
        getAvailable(entry) {
            // always available if empty
            if (!this.availables || this.availables.length == 0) { return true; }

            const year = entry.year;
            const month = (entry.month + 1).toString().padStart(2, '0');
            const date = entry.date.toString().padStart(2, '0');
            const ymd = `${year}-${month}-${date}`;

            return this.availables.includes(ymd);
        },
        getCalendarDataObject() { return Alpine.$data(this.$root.querySelector("table")); },
        jumpToYear(year) { this.getCalendarDataObject().gotoYear(year); },
        jumpToYearCurrentMonth(year) { this.getCalendarDataObject().gotoYear(year, this.getCalendarDataObject().month); },
        resetCalendar() { this.getCalendarDataObject().gotoToday(); },
        isSelected(entry) {
            let result = false;

            switch (this.selectMode) {
                case "single":
                    result = this.selectedEntry?.id == entry.id;
                    break;
                case "multiple":
                    const ymd = getYmdFromEntry(entry);

                    if (this.selectedDates.length == 1) {
                        result = this.selectedDates.includes(ymd);
                    } else if (this.selectedDates.length == 2) {
                        const s1 = this.selectedDates[0];
                        const s2 = this.selectedDates[1];

                        for (let date1 = new Date(s1); date1 <= new Date(s2); date1.setDate(date1.getDate() + 1)) {
                            const ymd1 = getYMD(date1.getFullYear(), date1.getMonth(), date1.getDate());
                            if (ymd == ymd1) {
                                result = true;
                                break;
                            }
                        }
                    }
                    break;
            }

            return result;
        },
        selectEntry(entry = null) {
            switch (this.selectMode) {
                case "single":
                    if (entry && this.selectedEntry && this.selectedEntry.id == entry.id) {
                        this.selectedEntry = null; // Toggle same entry
                        return;
                    }
                    this.selectedEntry = entry;

                    this.selectedDate = null;
                    if (this.selectedEntry) {
                        this.selectedDate = getYmdFromEntry(this.selectedEntry);
                    }

                    // Dispatch custom event for selected date
                    if (this.selectedDate) {
                        const myCalendarElement = this.$el.closest('my-calendar');
                        if (myCalendarElement) {
                            myCalendarElement.dispatchEvent(new CustomEvent('date-selected', {
                                detail: { date: this.selectedDate }
                            }));
                        }
                    }
                    break;
                case "multiple":
                    if (entry == null) {
                        this.selectedDates = [];
                        return;
                    }

                    let s1, s2;
                    const ymd = getYmdFromEntry(entry);

                    if (this.selectedDates.includes(ymd)) {
                        this.selectedDates = this.selectedDates.filter((item) => item != ymd);
                        return;
                    }

                    if (this.selectedDates.length == 1) {
                        s1 = new Date(this.selectedDates[0]);
                        const ymd1 = new Date(ymd);

                        if (ymd1 < s1) {
                            this.selectedDates.unshift(ymd);
                        } else {
                            this.selectedDates.push(ymd);
                        }
                    } else if (this.selectedDates.length == 2) {
                        s1 = new Date(this.selectedDates[0]);
                        const ymd1 = new Date(ymd);

                        if (ymd1 < s1) {
                            this.selectedDates[0] = ymd;
                        } else {
                            this.selectedDates[1] = ymd;
                        }
                    } else {
                        this.selectedDates = [];
                        this.selectedDates.push(ymd);
                    }

                    if (this.selectedDates.length > 1) {
                        s1 = this.selectedDates[0];
                        s2 = this.selectedDates[1];
                        for (let date1 = new Date(s1); date1 <= new Date(s2); date1.setDate(date1.getDate() + 1)) {
                            const ymd = getYMD(date1.getFullYear(), date1.getMonth(), date1.getDate());
                            if (this.availables.length > 0 && !this.availables.includes(ymd)) {
                                this.selectedDates = [];
                                return false;
                            }
                        }

                        // Dispatch custom event for selected date range
                        const myCalendarElement = this.$el.closest('my-calendar');
                        if (myCalendarElement) {
                            myCalendarElement.dispatchEvent(new CustomEvent('dates-selected', {
                                detail: {
                                    startDate: this.selectedDates[0],
                                    endDate: this.selectedDates[1]
                                }
                            }));
                        }
                    }
                    break;
            }
        },
        getSelection() {
            let result = null;
            switch (this.selectMode) {
                case "single":
                    result = this.selectedEntry;
                    break;
                case "multiple":
                    result = this.selectedDates;
                    break;
            }

            return result;
        }
    };

    return controller;
};

export function registerCalendar(config = {}) {
    if (!window.Alpine) {
        console.error('Alpine.js is not loaded. Please load Alpine.js first.');
        return null;
    }

    window.Alpine.data('calendar_entry', CalendarEntryController);
    window.Alpine.data('calendar_module', () => { return CalendarModuleController(config); });

    const result = {
        mount(el) {
            if (typeof el == 'string') { el = document.querySelector(el); }
            if (!el) { console.error('Cannot find target element.', el); }
            el.innerHTML = calendarTemplate;
            // window.Alpine.nextTick(() => { window.Alpine.initTree(el); }); // Must not be used
        },
        getTemplate() { return calendarTemplate; }
    };

    return result;
}

// Web Component 클래스 부분 수정
class CalendarElement extends HTMLElement {
    constructor() {
        super();
        this._config = {
            showCalendarCount: 1,
            selectMode: 'single',
            availableDates: []
        };

        // // 디버깅을 위한 로그 추가
        // console.log('Calendar element created');
    }

    // 관찰할 속성들 정의
    static get observedAttributes() {
        return ['show-calendar-count', 'select-mode', 'available-dates', 'config'];
    }

    // 속성이 변경되면 호출됨
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        // console.log(`Calendar attribute changed: ${name} = ${newValue}`);

        switch (name) {
            case 'show-calendar-count':
                this._config.showCalendarCount = parseInt(newValue, 10) || 1;
                break;
            case 'select-mode':
                this._config.selectMode = newValue || 'single';
                break;
            case 'available-dates':
                try {
                    this._config.availableDates = JSON.parse(newValue) || [];
                } catch (e) {
                    console.error('Invalid available-dates attribute:', e);
                    this._config.availableDates = [];
                }
                break;
            case 'config':
                try {
                    const configObj = JSON.parse(newValue);
                    this._config = { ...this._config, ...configObj };
                    // console.log('Config updated:', this._config);
                } catch (e) {
                    console.error('Invalid config attribute:', e);
                }
                break;
        }

        // 이미 DOM에 연결된 상태라면 업데이트
        if (this.isConnected) {
            this._updateCalendar();
        }
    }

    // 요소가 DOM에 연결될 때 호출됨
    connectedCallback() {
        // console.log('Calendar element connected to DOM');

        // HTML 속성에서 설정 가져오기
        const countAttr = this.getAttribute('show-calendar-count');
        const modeAttr = this.getAttribute('select-mode');
        const datesAttr = this.getAttribute('available-dates');
        const configAttr = this.getAttribute('config');

        // 개별 속성 처리
        if (countAttr) {
            this._config.showCalendarCount = parseInt(countAttr, 10) || 1;
        }

        if (modeAttr) {
            this._config.selectMode = modeAttr;
        }

        if (datesAttr) {
            try {
                this._config.availableDates = JSON.parse(datesAttr) || [];
            } catch (e) {
                console.error('Invalid available-dates attribute:', e);
            }
        }

        // config 객체로 한 번에 처리
        if (configAttr) {
            try {
                const parsedConfig = JSON.parse(configAttr);
                this._config = { ...this._config, ...parsedConfig };
                // console.log('Initial config:', this._config);
            } catch (e) {
                console.error('Invalid config attribute:', e);
            }
        }

        // Alpine.js 초기화 확인 후 마운트
        this._waitForAlpineAndMount();
    }

    // Alpine.js 초기화 대기 후 마운트
    _waitForAlpineAndMount() {
        if (window.Alpine && window.Alpine.version) {
            // console.log('Alpine.js detected, mounting calendar');
            this._mountCalendar(); // Alpine이 이미 로드됨
        } else {
            console.log('Waiting for Alpine.js to initialize...');
            // Alpine 로드 대기
            window.addEventListener('alpine:initialized', () => {
                console.log('Alpine:initialized event detected');
                this._mountCalendar();
            }, { once: true });

            // 백업: 약간의 지연 후 다시 시도
            setTimeout(() => {
                if (!this._mounted && window.Alpine) {
                    console.log('Mounting calendar after timeout');
                    this._mountCalendar();
                }
            }, 500);
        }
    }

    // 캘린더 마운트 메서드
    _mountCalendar() {
        if (this._mounted) return;

        if (!window.Alpine) {
            console.error('Alpine.js is not loaded. Please load Alpine.js first.');
            return;
        }

        // console.log('Mounting calendar with config:', this._config);
        this._mounted = true;

        try {
            const calendar = registerCalendar(this._config);
            if (calendar) {
                // console.log('Calendar registered successfully');
                calendar.mount(this);

                // Alpine 초기화 완료 후 이벤트 감시 설정
                setTimeout(() => {
                    this._setupDateSelectionListeners();
                }, 150);
            } else {
                console.error('Failed to register calendar');
            }
        } catch (error) {
            console.error('Error mounting calendar:', error);
        }
    }

    // 달력 업데이트
    _updateCalendar() {
        if (!this._mounted || !window.Alpine) return;

        // console.log('Updating calendar with new config');
        this.innerHTML = '';
        this._mounted = false;
        this._mountCalendar();
    }

    // 날짜 선택 감시 설정
    _setupDateSelectionListeners() {
        try {
            // console.log('Setting up date selection listeners');
            const moduleElement = this.querySelector('[x-data="calendar_module"]');
            if (moduleElement && moduleElement.__x) {
                console.log('Found calendar module element');
                const component = moduleElement.__x.$data;

                // selectEntry 메서드 오버라이드하여 이벤트 발생
                const originalSelectEntry = component.selectEntry;
                component.selectEntry = (entry = null) => {
                    originalSelectEntry.call(component, entry);

                    // 단일 선택 모드
                    if (component.selectMode === 'single' && component.selectedDate) {
                        this.dispatchEvent(new CustomEvent('date-selected', {
                            detail: { date: component.selectedDate }
                        }));
                    }

                    // 다중 선택 모드
                    if (component.selectMode === 'multiple' && component.selectedDates.length === 2) {
                        this.dispatchEvent(new CustomEvent('dates-selected', {
                            detail: {
                                startDate: component.selectedDates[0],
                                endDate: component.selectedDates[1]
                            }
                        }));
                    }
                };
                console.log('Selection listeners setup complete');
            // } else {
            //     console.warn('Calendar module element not found or Alpine data not initialized');
            }
        } catch (e) {
            console.warn('Error setting up date selection listeners:', e);
        }
    }
}

// 웹 컴포넌트 등록
if (!customElements.get('my-calendar')) {
    // console.log('Defining my-calendar custom element');
    customElements.define('my-calendar', CalendarElement);
}

// 자동 마운트 - <div data-calendar-mount></div>
if (typeof document != 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) {
            document.querySelectorAll('[data-calendar-mount]').forEach(el => {
                const config = {
                    showCalendarCount: parseInt(el.dataset.calendarCount || '1', 10),
                    selectMode: el.dataset.calendarSelectMode || 'single',
                    availableDates: el.dataset.calendarAvailableDates ? JSON.parse(el.dataset.calendarAvailableDates) : []
                };

                const calendar = registerCalendar(config);
                if (calendar) { calendar.mount(el); }
            });
        }
    });
}

window.CalendarComponent = { registerCalendar };