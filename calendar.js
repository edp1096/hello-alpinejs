let CALENDAR_WEEKDAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
]

let CALENDAR_WEEKDAYS_SHORT = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thr",
    "Fri",
    "Sat"
]

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
]

const CURRENT_MONTH = true
const OTHER_MONTH = false

function buildEntries(year, month) {
    var daysInMonth = getDaysInMonth(year, month)
    var entries = []

    for (var i = 1; i <= daysInMonth; i++) {
        entries.push(buildEntry(year, month, i, CURRENT_MONTH))
    }

    return entries
}

function buildEntry(year, month, date, isCurrentMonth) {
    const timestamp = new Date(year, month, date)

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
        // isWeekend: getIsWeekend(timestamp.getDay())
        isSaturday: getIsSaturday(timestamp.getDay()),
        isSunday: getIsSunday(timestamp.getDay())
    }

    return calendarEntry
}

function buildGrid(entries) {
    const grid = {
        headers: CALENDAR_WEEKDAYS.slice(),
        headersAbbreviated: CALENDAR_WEEKDAYS_SHORT.slice(),
        entries: entries.slice(),
        weeks: []
    }

    for (; ;) {
        const entry = grid.entries.at(0)
        if (getIsFirstEntryOfWeek(entry)) { break }
        grid.entries.unshift(buildEntry(entry.year, entry.month, (entry.date - 1), OTHER_MONTH))
    }

    for (; ;) {
        const entry = grid.entries.at(-1)
        if (getIsLastEntryOfWeek(entry)) { break }
        grid.entries.push(buildEntry(entry.year, entry.month, (entry.date + 1), OTHER_MONTH))
    }

    // Slice the full list of entries into weeks (for easier rendering).
    for (let i = 0; i < grid.entries.length; i += 7) {
        grid.weeks.push(grid.entries.slice(i, (i + 7)))
    }

    return grid
}

function getDaysInMonth(year, month) {
    const lastDayOfMonth = new Date(year, (month + 1), 0)
    return lastDayOfMonth.getDate()
}

function getIsFirstEntryOfWeek(entry) {
    return (entry.day == 0)
}

function getIsLastEntryOfWeek(entry) {
    return (entry.day == 6)
}

function getIsToday(date) {
    const timestamp = new Date()
    const isToday = (
        (date.getFullYear() == timestamp.getFullYear()) &&
        (date.getMonth() == timestamp.getMonth()) &&
        (date.getDate() == timestamp.getDate())
    )

    return isToday
}

function getIsWeekday(day) {
    return !getIsWeekend(day)
}

function getIsWeekend(day) {
    return ((day == 0) || (day == 6))
}

function getIsSaturday(day) {
    return (day == 6)
}

function getIsSunday(day) {
    return (day == 0)
}


const CalendarController = (initialYear, initialMonth) => {
    const timestamp = new Date()
    const year = (initialYear ?? timestamp.getFullYear())
    const month = (initialMonth ?? timestamp.getMonth())
    const monthName = CALENDAR_MONTHS[month]

    const entries = buildEntries(year, month)
    const grid = buildGrid(entries)

    const objectData = {
        year: year,
        month: month,
        monthName: monthName,
        entries: entries,
        grid: grid,

        gotoDate(target) {
            this.year = target.getFullYear()
            this.month = target.getMonth()
            this.monthName = CALENDAR_MONTHS[this.month]
            this.entries = buildEntries(this.year, this.month)
            this.grid = buildGrid(this.entries)
        },
        gotoNextMonth() {
            this.gotoDate(new Date(this.year, (this.month + 1), 1))
        },
        gotoToday() {
            this.gotoDate(new Date())
        },
        gotoPrevMonth() {
            this.gotoDate(new Date(this.year, (this.month - 1), 1))
        },
        gotoYear(year, month) {
            this.gotoDate(new Date(year, (month || 0), 1))
        }
    }

    return objectData
}

const CalendarAppController = () => {
    const objectData = {
        selectedEntry: null,
        availables: [],

        setAvailables(availables) { this.availables = availables },
        getAvailable(entry) {
            if (!this.availables || this.availables.length == 0) { return true } // always available if empty

            const year = entry.year
            const month = (entry.month + 1).toString().padStart(2, '0')
            const date = entry.date.toString().padStart(2, '0')
            const ymd = `${year}-${month}-${date}`

            return this.availables.includes(ymd)
        },
        getCalendarDataObject() { return Alpine.$data(document.querySelector(".calendar")) },
        jumpToYear(year) { this.getCalendarDataObject().gotoYear(year) },
        resetCalendar() { this.getCalendarDataObject().gotoToday() },
        selectEntry(entry) {
            // Toggle same entry
            if (entry && this.selectedEntry && (this.selectedEntry.id == entry.id)) {
                this.selectedEntry = null
                return
            }

            this.selectedEntry = entry
        }
    }

    return objectData
}

document.addEventListener("alpine:init", () => {
    Alpine.data("calendar_app", CalendarAppController)
    Alpine.data("calendar_entry", CalendarController)
})
