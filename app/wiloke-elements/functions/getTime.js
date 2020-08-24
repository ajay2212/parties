import moment from "moment";
import momentTimeZone from "moment-timezone";

export const getTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const getTodayTimeZone = (zone) => {
  return momentTimeZone.tz(zone).unix();
};

const getTimeUnixByDay = (time, zone) => {
  const today = moment().format("YYYY-MM-DD");
  return momentTimeZone.tz(`${today} ${time}`, zone).unix();
};

const getNextUnixDay = (zone) => {
  return momentTimeZone.tz("2020-05-15 05:00:00", zone).unix();
};

const compareDate = (time1, time2, zone) => {
  const today2359 = getTimeUnixByDay("23:59:59", zone);
  const date1 = getTimeUnixByDay(time1, zone);
  const date2 = getTimeUnixByDay(time2, zone);
  if (date2 < date1 && date1 < today2359) {
    const nextDay = moment().add(1, "day").format("YYYY-MM-DD");

    const date3 = momentTimeZone.tz(`${nextDay} ${time2}`, zone).unix();

    return date1 < getTodayTimeZone(zone) && getTodayTimeZone(zone) < date3;
  }
  return date1 < getTodayTimeZone(zone) && getTodayTimeZone(zone) < date2;
};

const getBusinessStatus = (data, zone) => {
  if (!data) return false;
  const today = momentTimeZone.tz(moment(), zone).format("dddd");
  const nowUnix = getTodayTimeZone(zone);
  const now7h = getTimeUnixByDay("07:00:00", zone);
  const now0h = getTimeUnixByDay("00:00:00", zone);
  return data.reduce((isOpen, item, index) => {
    let compareDay;
    if (now0h < nowUnix && nowUnix < now7h) {
      compareDay = momentTimeZone
        .tz(moment().subtract(1, "day"), zone)
        .format("dddd");
    } else {
      compareDay = item.dayOfWeek;
    }
    if (today.toLowerCase() === compareDay) {
      if (item.isOpen === "yes") {
        if (
          item.secondOpenHour === null ||
          (getTimeUnixByDay(item.firstOpenHour, zone) < nowUnix &&
            nowUnix < getTimeUnixByDay(item.firstCloseHour, zone))
        ) {
          if ((item.firstOpenHour === item.firstCloseHour) === "24:00:00") {
            return (isOpen = true);
          }
          return (isOpen = compareDate(
            item.firstOpenHour,
            item.firstCloseHour,
            zone
          ));
        }

        return (isOpen = compareDate(
          item.secondOpenHour,
          item.secondCloseHour,
          zone
        ));
        if (item.firstOpenHour === null && item.secondOpenHour === null) {
          return (isOpen = false);
        }
      } else {
        return (isOpen = "day_off");
      }
    }
    return isOpen;
  }, false);
};

const getBusinessDay = (item, zone) => {
  const today = momentTimeZone.tz(moment(), zone).format("dddd");
  const nowUnix = getTodayTimeZone(zone);
  const now7h = getTimeUnixByDay("07:00:00", zone);
  const now0h = getTimeUnixByDay("00:00:00", zone);
  let compareDay;
  let isOpen = false;
  if (now0h < nowUnix && nowUnix < now7h) {
    compareDay = momentTimeZone
      .tz(moment().subtract(1, "day"), zone)
      .format("dddd");
  } else {
    compareDay = item.dayOfWeek;
  }
  if (today.toLowerCase() === compareDay) {
    if (item.isOpen === "yes") {
      if (
        item.secondOpenHour === null ||
        (getTimeUnixByDay(item.firstOpenHour, zone) < nowUnix &&
          nowUnix < getTimeUnixByDay(item.firstCloseHour, zone))
      ) {
        if ((item.firstOpenHour === item.firstCloseHour) === "24:00:00") {
          return (isOpen = true);
        }
        return (isOpen = compareDate(
          item.firstOpenHour,
          item.firstCloseHour,
          zone
        ));
      }

      return (isOpen = compareDate(
        item.secondOpenHour,
        item.secondCloseHour,
        zone
      ));
      if (item.firstOpenHour === null && item.secondOpenHour === null) {
        return (isOpen = false);
      }
    } else {
      return (isOpen = "day_off");
    }
  }
  return (isOpen = "day_off");
};

export { getBusinessStatus, getBusinessDay };
