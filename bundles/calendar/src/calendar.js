// src/calendar.js
import calendarTemplate from './calendar.html';
import './calendar.scss'; // SCSS 파일 임포트

// 상수 정의
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
    return (entry.day === 0);
}

function getIsLastEntryOfWeek(entry) {
    return (entry.day === 6);
}

function getIsToday(date) {
    const timestamp = new Date();
    const isToday = (
        (date.getFullYear() === timestamp.getFullYear()) &&
        (date.getMonth() === timestamp.getMonth()) &&
        (date.getDate() === timestamp.getDate())
    );

    return isToday;
}

function getIsWeekday(day) {
    return !getIsWeekend(day);
}

function getIsWeekend(day) {
    return ((day === 0) || (day === 6));
}

function getIsSaturday(day) {
    return (day === 6);
}

function getIsSunday(day) {
    return (day === 0);
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

// Alpine.js Data Controllers
const CalendarEntryController = (initialYear, initialMonth) => {
    const timestamp = new Date();
    const year = (initialYear ?? timestamp.getFullYear());
    const month = (initialMonth ?? timestamp.getMonth());
    const monthName = CALENDAR_MONTHS[month];

    const entries = buildEntries(year, month);
    const grid = buildGrid(entries);

    return {
        year: year,
        month: month,
        monthName: monthName,
        entries: entries,
        grid: grid,

        gotoDate(target) {
            this.year = target.getFullYear();
            this.month = target.getMonth();
            this.monthName = CALENDAR_MONTHS[this.month];
            this.entries = buildEntries(this.year, this.month);
            this.grid = buildGrid(this.entries);
        },
        gotoNextMonth() {
            this.gotoDate(new Date(this.year, (this.month + 1), 1));
        },
        gotoToday() {
            this.gotoDate(new Date());
        },
        gotoPrevMonth() {
            this.gotoDate(new Date(this.year, (this.month - 1), 1));
        },
        gotoYear(year, month) {
            this.gotoDate(new Date(year, (month || 0), 1));
        }
    };
};

const CalendarModuleController = () => {
    return {
        selectMode: "single",
        selectedEntry: null,
        selectedDate: null,
        selectedDates: [],
        availables: [],

        init() {
            this.$watch("selectMode", () => { this.clearSelection(); });

            // Random available dates for demo
            this.setAvailables(this.createRandomAvailableDates());
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
        setSelectMode(mode) {
            this.selectMode = mode;
        },
        setAvailables(availables) {
            this.availables = availables;
        },
        getAvailable(entry) {
            // always available if empty
            if (!this.availables || this.availables.length === 0) { return true; }

            const year = entry.year;
            const month = (entry.month + 1).toString().padStart(2, '0');
            const date = entry.date.toString().padStart(2, '0');
            const ymd = `${year}-${month}-${date}`;

            return this.availables.includes(ymd);
        },
        getCalendarDataObject() {
            return Alpine.$data(this.$root.querySelector("table"));
        },
        jumpToYear(year) {
            this.getCalendarDataObject().gotoYear(year);
        },
        jumpToYearCurrentMonth(year) {
            this.getCalendarDataObject().gotoYear(year, this.getCalendarDataObject().month);
        },
        resetCalendar() {
            this.getCalendarDataObject().gotoToday();
        },
        isSelected(entry) {
            let result = false;

            switch (this.selectMode) {
                case "single":
                    result = this.selectedEntry?.id === entry.id;
                    break;
                case "multiple":
                    const ymd = getYmdFromEntry(entry);

                    if (this.selectedDates.length === 1) {
                        result = this.selectedDates.includes(ymd);
                    } else if (this.selectedDates.length === 2) {
                        const s1 = this.selectedDates[0];
                        const s2 = this.selectedDates[1];

                        for (let date1 = new Date(s1); date1 <= new Date(s2); date1.setDate(date1.getDate() + 1)) {
                            const ymd1 = getYMD(date1.getFullYear(), date1.getMonth(), date1.getDate());
                            if (ymd === ymd1) {
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
                    if (entry && this.selectedEntry && this.selectedEntry.id === entry.id) {
                        this.selectedEntry = null; // Toggle same entry
                        return;
                    }
                    this.selectedEntry = entry;

                    this.selectedDate = null;
                    if (this.selectedEntry) {
                        this.selectedDate = getYmdFromEntry(this.selectedEntry);
                    }
                    break;
                case "multiple":
                    if (entry === null) {
                        this.selectedDates = [];
                        return;
                    }

                    let s1, s2;
                    const ymd = getYmdFromEntry(entry);

                    if (this.selectedDates.includes(ymd)) {
                        this.selectedDates = this.selectedDates.filter((item) => item !== ymd);
                        return;
                    }

                    if (this.selectedDates.length === 1) {
                        s1 = new Date(this.selectedDates[0]);
                        const ymd1 = new Date(ymd);

                        if (ymd1 < s1) {
                            this.selectedDates.unshift(ymd);
                        } else {
                            this.selectedDates.push(ymd);
                        }
                    } else if (this.selectedDates.length === 2) {
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
};

export function registerCalendar() {
    if (!window.Alpine) {
        console.error('Alpine.js is not loaded. Please load Alpine.js first.');
        return null;
    }

    window.Alpine.data('calendar_entry', CalendarEntryController);
    window.Alpine.data('calendar_module', CalendarModuleController);

    return {
        mount(el) {
            if (typeof el === 'string') {
                el = document.querySelector(el);
            }

            if (el) {
                el.innerHTML = calendarTemplate;
                // window.Alpine.initTree(el);
            } else {
                console.error('Cannot find target element.', el);
            }
        },
        getTemplate() {
            return calendarTemplate;
        }
    };
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) {
            document.querySelectorAll('[data-calendar-mount]').forEach(el => {
                const calendar = registerCalendar();
                if (calendar) {
                    calendar.mount(el);
                }
            });
        }
    });
}

window.CalendarComponent = { registerCalendar };