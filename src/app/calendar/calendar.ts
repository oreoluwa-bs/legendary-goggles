import {
  addDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  isSameDay,
  isThisMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { map } from "../utils";

/**
 * Get days of the week
 */
export function takeWeek(start = new Date()) {
  let date = startOfWeek(startOfDay(start));

  const week = eachDayOfInterval({ start: date, end: addDays(date, 6) });
  return week;
}

function takeMonth(start = new Date()) {
  let month: Date[][] = [];
  let date = start;

  let monthStart = startOfMonth(date);
  let monthEnd = endOfMonth(date);

  let weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd });

  weeks.forEach((week) => {
    month.push(takeWeek(week));
  });

  return month;
}

const hoursInADay = [...new Array(24)].map((_, ind) => ind);

interface CalendarEvent {
  startDate: Date;
  endDate: Date;
  name: string;
}

export class Calendar {
  DOM: {
    wrapper: HTMLElement;
    container: HTMLElement;
    timeContainer: HTMLElement;
    weekContainer: HTMLElement;
    weekHeading: HTMLElement;
    toolbar: HTMLElement;
  };
  date = new Date();
  events: CalendarEvent[] = [];
  calendarDays: CalendarDay[] = [];

  constructor(
    el: HTMLElement,
    events = [
      {
        startDate: new Date(2023, 4, 15, 20, 17),
        endDate: new Date(2023, 4, 15, 23, 17),
        name: "Event One",
      },
      {
        startDate: new Date(2023, 4, 18, 15, 0),
        endDate: new Date(2023, 4, 18, 16, 0),
        name: "Event Two",
      },
      {
        startDate: new Date(2023, 4, 14, 20, 17),
        endDate: new Date(2023, 4, 14, 21, 0),
        name: "Event Three",
      },
      {
        startDate: new Date(2023, 4, 19, 20, 17),
        endDate: new Date(2023, 4, 20, 22, 17),
        name: "Event 8",
      },
    ]
  ) {
    el.classList.add("calendar-container");
    const container = document.createElement("div");
    container.classList.add("calendar");

    const timeContainer = document.createElement("div");
    timeContainer.classList.add("day-timelist");

    const weekHeading = document.createElement("div");
    weekHeading.classList.add("calendar-heading");
    const blank = document.createElement("div");
    weekHeading.append(blank);
    weekHeading.style.display = "grid";
    weekHeading.style.gridTemplateColumns = "40px repeat(7,1fr)";

    const weekContainer = document.createElement("div");
    weekContainer.classList.add("calendar-week");

    container.append(timeContainer);
    container.append(weekContainer);

    el.append(weekHeading);
    el.append(container);

    const toolbar = document.querySelector<HTMLElement>(".calendar-toolbar")!;
    const month = document.createElement("span");
    month.classList.add("calendar-month-heading");
    toolbar.append(month);

    this.DOM = {
      wrapper: el,
      container,
      timeContainer,
      weekContainer,
      weekHeading,
      toolbar,
    };
    this.events = events;

    this.render();
  }

  private get getWeek() {
    return takeWeek(this.date);
  }

  render() {
    this.calendarDays = [];
    this.DOM.timeContainer.innerHTML = "";
    this.DOM.weekContainer.innerHTML = "";
    this.DOM.weekHeading.innerHTML = "<div></div>";

    // this is because the timer top is wrong so we scroll to the top on every rerender and scroll back to the time
    this.DOM.wrapper.scrollTo({ top: 0 });

    hoursInADay.forEach((hour) => {
      const div = document.createElement("div");
      div.classList.add("day-hour-span");

      const value = `${hour.toString().padStart(2, "0")}`;
      div.innerHTML = value;

      div.setAttribute("data-hour", value);

      this.DOM.timeContainer.append(div);
    });

    this.getWeek.forEach((weekDay) => {
      const dayOfMonth = weekDay.getDate().toString();

      const div = document.createElement("div");
      div.innerHTML = `<div class='calendar-week-head'>
        <div class='day-num'>${dayOfMonth.padStart(2, "0")}</div>
            <div class='day-text'>
                ${new Intl.DateTimeFormat("en", { weekday: "long" }).format(
                  weekDay
                )}
            </div>
        </div>`;

      if (isToday(weekDay)) {
        div.classList.add("calendar-current-day");
      }
      this.DOM.weekHeading.append(div);
    });

    this.getWeek.forEach((weekDay) => {
      const events = this.events.filter(
        (day) =>
          isSameDay(weekDay, day.startDate) || isSameDay(weekDay, day.endDate)
      );
      const calDay = new CalendarDay(weekDay, events);
      this.calendarDays.push(calDay);
      this.DOM.weekContainer.append(calDay.render());
      // setTimeout(() => {
      calDay.renderEvents();
      // }, 200);
    });

    // set toolbar title
    const month = this.DOM.toolbar.querySelector(".calendar-month-heading")!;
    month.innerHTML = new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric",
    }).format(this.date);

    {
      this.renderTimeIndicator();
    }
  }

  addEvent(event: CalendarEvent) {
    const days = this.calendarDays.filter((day) => {
      return (
        isSameDay(day.day, event.startDate) || isSameDay(day.day, event.endDate)
      );
    });

    days.forEach((day) => {
      day.addEvent(event);
    });

    this.events.push(event);
  }

  renderTimeIndicator() {
    const currDate = new Date();
    const hour = currDate.getHours();
    // const hour = "15";
    const min = currDate.getMinutes();

    const hourSlot = this.DOM.timeContainer.querySelector(
      `[data-hour='${hour.toString().padStart(2, "0")}']`
    )!;
    const daySlot = this.DOM.weekContainer.querySelector(
      ".calendar-current-day"
    );
    // const daySlot =
    //   this.DOM.weekContainer.querySelectorAll(".calendar-day")[3]!;

    const pos = {
      start: hourSlot.getBoundingClientRect(),

      day: daySlot?.getBoundingClientRect(),

      container: this.DOM.container.getBoundingClientRect(),
    };

    const fractal = {
      start: ((min * 50) / 30 / 100) * pos.start.height,
    };

    const div = document.createElement("div");
    div.classList.add("time-indicator");

    div.style.top = `${
      window.scrollY +
      pos.start.top -
      pos.start.height -
      5 +
      fractal.start +
      this.DOM.wrapper.scrollTop
    }px`;

    if (pos.day) {
      div.style.width = `calc(${
        pos.day.right - pos.container.left + 5
      }px - ${3}rem)`;

      div.style.setProperty("--mainWidth", pos.day.width + "px");
    }

    this.DOM.weekContainer.append(div);

    div.scrollIntoView({ block: "center" });
  }

  prevWeek() {
    const currweekStart = this.getWeek[0];

    // subtract
    this.date = subDays(currweekStart, 2);

    this.render();
  }

  nextWeek() {
    const currweekStart = this.getWeek[this.getWeek.length - 1];

    // add
    this.date = addDays(currweekStart, 2);

    this.render();
  }
}

class CalendarDay {
  readonly day: Date;
  protected events: CalendarEvent[] = [];
  DOM: { wrapper?: HTMLElement; mainContainer?: HTMLElement } = {};
  colors = [
    "#5F9EA0", // Cadet Blue
    "#0066CC", // Royal Blue
    "#9C51B6", // Purple
    "#FFCE67", // Sandy Yellow
    "#FFD700", // Gold
    "#00A896", // Emerald Green
    "#FF9F1C", // Orange
    "#8B4513", // Saddle Brown
    "#800000", // Maroon
  ];

  constructor(day: Date, events: CalendarEvent[]) {
    this.day = day;
    this.events = events;
    this.DOM.mainContainer = document.querySelector<HTMLElement>(`.calendar`)!;
  }

  render() {
    let dayHour = hoursInADay.map((hur) => {
      return `
        <div class='day-hour-span' style="display:flex; flex-direction:column;" data-hour=${hur
          .toString()
          .padStart(2, "0")}>
            <div class='day-hour-slot'></div>
            <div class=day-hour-slot></div>
        </div>`;
    });

    const dayOfMonth = this.day.getDate().toString();

    const div = document.createElement("div");
    div.classList.add("calendar-day");
    div.innerHTML = `
            <div class='day-wrapper'>
              <div class='day-time-list'>
              ${dayHour.join("")}
              </div>
              <div class='day-event-list'>
              
              </div>
            </div>
    `;

    // ${dayHour.join("")}
    if (isThisMonth(this.day)) {
      div.setAttribute("data-currentMonth", "true");
    }

    // div.draggable = true;

    if (isToday(this.day)) {
      div.classList.add("calendar-current-day");
    }

    this.DOM.wrapper = div;

    this.addListeners();
    return div;
  }

  renderEvents() {
    // const eventsMap = new Map<string, CalendarEvent[]>();

    // this.events.forEach((event) => {
    //   const startHour = event.startDate.getHours().toString().padStart(2, "0");
    //   const endHour = event.endDate.getHours().toString().padStart(2, "0");
    //   const existingValue = eventsMap.get(startHour) ?? [];

    //   eventsMap.set(startHour, [...existingValue, event]);
    // });

    const eventsMap = this.events.reduce((prev, curr) => {
      const startHour = curr.startDate.getHours().toString().padStart(2, "0");
      const endHour = curr.endDate.getHours().toString().padStart(2, "0");

      const existingValue = prev.get(startHour) ?? [];
      prev.set(startHour, [...existingValue, curr]);
      return prev;
    }, new Map<string, CalendarEvent[]>());

    let v = Object.entries(Object.fromEntries(eventsMap)).map(
      ([key, value]) => {
        return value.map((event, index) => {
          const collor = this.colors[index % this.colors.length];

          const startsToday = isSameDay(event.startDate, this.day);
          const endsToday = isSameDay(event.endDate, this.day);

          const startHour = startsToday
            ? event.startDate.getHours().toString().padStart(2, "0")
            : "00";
          const endHour = endsToday
            ? event.endDate.getHours().toString().padStart(2, "0")
            : "00";
          const hourSlot = {
            start: this.DOM.wrapper?.querySelector(
              `.day-time-list [data-hour="${startHour}"]`
            )!,
            end: this.DOM.wrapper?.querySelector(
              `.day-time-list [data-hour="${endHour}"]`
            )!,
          };

          const pos = {
            start: hourSlot.start.getBoundingClientRect(),
            end: hourSlot.end.getBoundingClientRect(),

            mainContainer: this.DOM.mainContainer?.getBoundingClientRect()!,
          };

          const fractal = {
            start: startsToday
              ? ((event.startDate.getMinutes() * 50) / 30 / 100) *
                pos.start.height
              : 0,
            end: endsToday
              ? ((event.endDate.getMinutes() * 50) / 30 / 100) * pos.end.height
              : 0,
          };

          //   Add the window scroll position cause get bounding client rect is relative to the viewport
          return `
          <div class='day-event' style="top:${
            window.scrollY +
            pos.start.top -
            pos.start.height -
            5 +
            fractal.start +
            (this.DOM.mainContainer?.scrollTop ?? 0)
          }px;height:${Math.abs(
            window.scrollY +
              pos.end.top -
              (window.scrollY + pos.start.top) +
              fractal.end
          )}px;background-color:${collor};width:${100 / value.length}%;left:${
            (100 / value.length) * index
          }%;" draggable=true>
              <p>${event.name}</p>
              <time>${startHour}:${event.startDate
            .getMinutes()
            .toString()
            .padStart(2, "0")}</time> - 
              <time>${endHour}:${event.endDate
            .getMinutes()
            .toString()
            .padStart(2, "0")}</time>
          </div>
          `;
        });
      }
    );

    this.DOM.wrapper!.querySelector(".day-event-list")!.innerHTML = v
      .flat(1)
      .join("");
  }

  addEvent(event: CalendarEvent) {
    this.events = [...this.events, event];
    this.renderEvents();
  }

  removeEvent(event: CalendarEvent, index: number) {
    this.events = this.events.filter((even, ind) => {
      // // Change to Id
      // return event.name !
      return ind !== index;
    });

    this.renderEvents();
  }

  addListeners() {
    this.addTimeSlotListeners();
  }

  addTimeSlotListeners() {
    const eventList =
      this.DOM.wrapper!.querySelector<HTMLElement>(".day-event-list");
    const hourSlots = this.DOM.wrapper?.querySelectorAll<HTMLElement>(
      ".day-time-list .day-hour-slot"
    );

    hourSlots?.forEach((slot) => {
      const hourSlotWrapper = slot.parentElement;
      const hour = hourSlotWrapper?.getAttribute("data-hour");

      if (!hour || !hourSlotWrapper) return;

      slot.addEventListener("mousedown", (e) => {
        const bb = hourSlotWrapper.getBoundingClientRect();
        const orgPos = {
          // get percentage
          y: map(e.clientY, bb.top, bb.bottom, 0, 100),
        };

        // ((event.startDate.getMinutes() * 50) / 30 / 100) *
        //         pos.start.height

        // add drag end
        slot.addEventListener("mouseup", (ev) => {
          const startDate = new Date(this.day);
          startDate.setHours(Number(hour));
          startDate.setMinutes((orgPos.y / 100) * 60);

          const endDate = new Date(startDate);
          endDate.setHours(Number(hour) + 2);

          this.addEvent({
            name: `New event ${this.events.length + 1}`,
            startDate,
            endDate,
          });
        });
      });
    });
  }
}

// CalendarDayTime(){
//
// }
