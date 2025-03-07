var CalendarComponent=(()=>{var f=Object.defineProperty;var T=Object.getOwnPropertyDescriptor;var _=Object.getOwnPropertyNames;var Y=Object.prototype.hasOwnProperty;var N=(t,a)=>{for(var e in a)f(t,e,{get:a[e],enumerable:!0})},O=(t,a,e,s)=>{if(a&&typeof a=="object"||typeof a=="function")for(let n of _(a))!Y.call(t,n)&&n!==e&&f(t,n,{get:()=>a[n],enumerable:!(s=T(a,n))||s.enumerable});return t};var F=t=>O(f({},"__esModule",{value:!0}),t);var U={};N(U,{registerCalendar:()=>k});var b=`<div x-data="calendar_module" class="alpine-calendar-component"><button @click="changeAvailableDates">Change availableDates</button><br><label for="selection-mode">Selection mode:</label><select x-model="selectMode" id="selection-mode"><option value="single" selected>Single</option><option value="multiple">Multiple</option></select><template x-if="!selectedEntry && selectedDates.length == 0"><p>Please select date.</p></template><template x-if="selectedEntry"><p> Selected date: <strong><span x-text="selectedDate"></span></strong><template x-if="selectedEntry?.isToday"><span>(Today!)</span></template><button @click="selectEntry(null)">Clear</button></p></template><template x-if="selectedDates.length > 0"><p> Selected dates: <strong><span x-text="selectedDates[0]"></span> ~ <span x-text="selectedDates[1]"></span></strong><button @click="selectEntry(null)">Clear</button></p></template><p class="alpine-calendar-component__jumper"><strong>Jump to:</strong><button @click="resetCalendar">Today</button><template x-for="(_, index) in Array(4).fill(null)" :key="index"><button @click="jumpToYearCurrentMonth(getToday().year+index)" x-text="getToday().year+index"></button></template></p><div x-data="calendar_entry" x-ref="calendarEntry" class="alpine-calendar-component__container"><template x-for="(g, k) in grids" :key="k"><table class="alpine-calendar-component__calendar"><thead><tr><th colspan="7"><div class="alpine-calendar-component__tools"><button @click="gotoPrevMonth()">&larr;</button><span x-text="monthNames[k]"></span><span x-text="years[k]"></span><button @click="gotoNextMonth()">&rarr;</button></div></th></tr><tr><template x-for="header in g.headersAbbreviated" :key="header"><th scope="col" x-text="header"></th></template></tr></thead><tbody><template x-for="(week, i) in g.weeks" :key="i"><tr><template x-for="entry in week" :key="entry.id"><td><button @click="selectEntry(entry)" :class="{ 'current': entry.isCurrentMonth, 'other': entry.isOtherMonth, 'today': entry.isToday, 'weekday': entry.isWeekday, 'saturday': entry.isSaturday, 'sunday': entry.isSunday, 'selected': isSelected(entry) }" :disabled="!getAvailable(entry)" x-text="entry.date"></button></td></template></tr></template></tbody></table></template></div></div>`;var E=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],j=["Sun","Mon","Tue","Wed","Thr","Fri","Sat"],g=["January","February","March","April","May","June","July","August","September","October","November","December"],$=!0,x=!1;function M(t,a){let e=I(t,a),s=[];for(let n=1;n<=e;n++)s.push(C(t,a,n,$));return s}function C(t,a,e,s){let n=new Date(t,a,e);return{id:n.getTime(),year:n.getFullYear(),month:n.getMonth(),monthName:g[n.getMonth()],date:n.getDate(),day:n.getDay(),dayName:E[n.getDay()],isToday:L(n),isCurrentMonth:s,isOtherMonth:!s,isWeekday:H(n.getDay()),isSaturday:P(n.getDay()),isSunday:q(n.getDay())}}function w(t){let a={headers:E.slice(),headersAbbreviated:j.slice(),entries:t.slice(),weeks:[]};for(;;){let e=a.entries.at(0);if(R(e))break;a.entries.unshift(C(e.year,e.month,e.date-1,x))}for(;;){let e=a.entries.at(-1);if(W(e))break;a.entries.push(C(e.year,e.month,e.date+1,x))}for(let e=0;e<a.entries.length;e+=7)a.weeks.push(a.entries.slice(e,e+7));return a}function I(t,a){return new Date(t,a+1,0).getDate()}function R(t){return t.day==0}function W(t){return t.day==6}function L(t){let a=new Date;return t.getFullYear()==a.getFullYear()&&t.getMonth()==a.getMonth()&&t.getDate()==a.getDate()}function H(t){return!J(t)}function J(t){return t==0||t==6}function P(t){return t==6}function q(t){return t==0}function v(t,a,e){return a=(a+1).toString().padStart(2,"0"),e=e.toString().padStart(2,"0"),`${t}-${a}-${e}`}function S(t){return v(t.year,t.month,t.date)}var K=(t,a)=>{let e=1,s=new Date,n=t??s.getFullYear(),l=a??s.getMonth(),r=[],o=[],h=[],p=[];for(let i=0;i<e;i++){let c=new Date(n,l+i),u=c.getFullYear(),y=c.getMonth(),m=g[y];r.push(u),o.push(y),h.push(m);let D=M(u,y);p.push(w(D))}return{moreMonthCount:e,year:n,month:l,years:r,months:o,monthNames:h,grids:p,gotoDate(i){this.year=i.getFullYear(),this.month=i.getMonth(),this.monthName=g[this.month],this.entries=M(this.year,this.month),this.grid=w(this.entries),this.years=[],this.months=[],this.monthNames=[],this.grids=[];for(let c=0;c<this.moreMonthCount;c++){let u=new Date(this.year,this.month+c),y=u.getFullYear(),m=u.getMonth(),D=g[m];this.years.push(y),this.months.push(m),this.monthNames.push(D);let A=M(y,m);this.grids.push(w(A))}},gotoNextMonth(){this.gotoDate(new Date(this.year,this.month+1,1))},gotoToday(){this.gotoDate(new Date)},gotoPrevMonth(){this.gotoDate(new Date(this.year,this.month-1,1))},gotoYear(i,c){this.gotoDate(new Date(i,c||0,1))}}},G=(t={})=>({showCalendarCount:t.showCalendarCount||1,selectMode:t.selectMode||"single",selectedEntry:null,selectedDate:null,selectedDates:[],availables:t.availableDates||[],async init(){this.$watch("selectMode",()=>{this.clearSelection()}),this.availables[0]=="random"&&this.setAvailables(this.createRandomAvailableDates()),this.showCalendarCount>1&&(await this.$nextTick(),this.updateShowMonthCount(this.showCalendarCount))},createRandomAvailableDates(){let e=new Date,s=e.getFullYear(),n=e.getMonth(),l=new Date(s,n,1),r=new Date(s,n+2,0),o=[];for(let d=new Date(l);d<=r;d.setDate(d.getDate()+1)){let i=d.getFullYear(),c=String(d.getMonth()+1).padStart(2,"0"),u=String(d.getDate()).padStart(2,"0");o.push(`${i}-${c}-${u}`)}let h=[...o],p=Math.floor(Math.random()*(o.length/2));for(let d=0;d<p;d++){let i=Math.floor(Math.random()*h.length);h.splice(i,1)}return h},changeAvailableDates(){this.availables.length>0?this.setAvailables([]):this.setAvailables(this.createRandomAvailableDates()),this.clearSelection()},getToday(){let e=new Date,s=e.getFullYear(),n=String(e.getMonth()+1).padStart(2,"0"),l=String(e.getDate()).padStart(2,"0");return{year:s,month:n,date:l}},clearSelection(){this.selectedEntry=null,this.selectedDate=null,this.selectedDates=[]},setSelectMode(e){this.selectMode=e},updateShowMonthCount(e){e<=0&&(e=1),this.getCalendarDataObject().moreMonthCount=e,this.clearSelection(),this.jumpToYearCurrentMonth(this.getCalendarDataObject().year)},setAvailables(e){this.availables=e},getAvailable(e){if(!this.availables||this.availables.length==0)return!0;let s=e.year,n=(e.month+1).toString().padStart(2,"0"),l=e.date.toString().padStart(2,"0"),r=`${s}-${n}-${l}`;return this.availables.includes(r)},getCalendarDataObject(){return Alpine.$data(this.$root.querySelector("table"))},jumpToYear(e){this.getCalendarDataObject().gotoYear(e)},jumpToYearCurrentMonth(e){this.getCalendarDataObject().gotoYear(e,this.getCalendarDataObject().month)},resetCalendar(){this.getCalendarDataObject().gotoToday()},isSelected(e){let s=!1;switch(this.selectMode){case"single":s=this.selectedEntry?.id==e.id;break;case"multiple":let n=S(e);if(this.selectedDates.length==1)s=this.selectedDates.includes(n);else if(this.selectedDates.length==2){let l=this.selectedDates[0],r=this.selectedDates[1];for(let o=new Date(l);o<=new Date(r);o.setDate(o.getDate()+1)){let h=v(o.getFullYear(),o.getMonth(),o.getDate());if(n==h){s=!0;break}}}break}return s},selectEntry(e=null){switch(this.selectMode){case"single":if(e&&this.selectedEntry&&this.selectedEntry.id==e.id){this.selectedEntry=null;return}this.selectedEntry=e,this.selectedDate=null,this.selectedEntry&&(this.selectedDate=S(this.selectedEntry));break;case"multiple":if(e==null){this.selectedDates=[];return}let s,n,l=S(e);if(this.selectedDates.includes(l)){this.selectedDates=this.selectedDates.filter(r=>r!=l);return}if(this.selectedDates.length==1?(s=new Date(this.selectedDates[0]),new Date(l)<s?this.selectedDates.unshift(l):this.selectedDates.push(l)):this.selectedDates.length==2?(s=new Date(this.selectedDates[0]),new Date(l)<s?this.selectedDates[0]=l:this.selectedDates[1]=l):(this.selectedDates=[],this.selectedDates.push(l)),this.selectedDates.length>1){s=this.selectedDates[0],n=this.selectedDates[1];for(let r=new Date(s);r<=new Date(n);r.setDate(r.getDate()+1)){let o=v(r.getFullYear(),r.getMonth(),r.getDate());if(this.availables.length>0&&!this.availables.includes(o))return this.selectedDates=[],!1}}break}},getSelection(){let e=null;switch(this.selectMode){case"single":e=this.selectedEntry;break;case"multiple":e=this.selectedDates;break}return e}});function k(t={}){return window.Alpine?(window.Alpine.data("calendar_entry",K),window.Alpine.data("calendar_module",()=>G(t)),{mount(e){typeof e=="string"&&(e=document.querySelector(e)),e||console.error("Cannot find target element.",e),e.innerHTML=b},getTemplate(){return b}}):(console.error("Alpine.js is not loaded. Please load Alpine.js first."),null)}typeof document<"u"&&document.addEventListener("DOMContentLoaded",()=>{window.Alpine&&document.querySelectorAll("[data-calendar-mount]").forEach(t=>{let a={showCalendarCount:parseInt(t.dataset.calendarCount||"1",10),selectMode:t.dataset.calendarSelectMode||"single",availableDates:t.dataset.calendarAvailableDates?JSON.parse(t.dataset.calendarAvailableDates):[]},e=k(a);e&&e.mount(t)})});window.CalendarComponent={registerCalendar:k};return F(U);})();
