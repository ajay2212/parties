import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet } from "react-native";
import {
  isEmpty,
  getBusinessDay,
  Uppercasewords,
  RTL,
} from "../../wiloke-elements";
import * as Consts from "../../constants/styleConstants";
import momentTimezone from "moment-timezone";
import moment from "moment";

const _getCurrentDayColor = (item, timezone) => {
  const isOpen = getBusinessDay(item, timezone);
  const today = momentTimezone.tz(moment(), timezone).format("dddd");
  if (today.toLowerCase() !== item.dayOfWeek) return Consts.colorDark2;

  return !isOpen || isOpen === "day_off"
    ? Consts.colorQuaternary
    : Consts.colorSecondary;
};

const renderItem = (timezone, dayOff, translations) => (item, index) => {
  if (!item)
    return (
      <Text key={index.toString()} style={styles.dayOff}>
        {dayOff}
      </Text>
    );
  return (
    <View
      key={index.toString()}
      style={[styles.spaceBetween, { paddingVertical: 8 }]}
    >
      <View style={styles.left}>
        <Text
          style={[styles.text, { color: _getCurrentDayColor(item, timezone) }]}
        >
          {Uppercasewords(translations.daysWeek[item.dayOfWeek])}
        </Text>
      </View>

      <View style={styles.spaceBetween}>
        {item.firstOpenHour && item.firstCloseHour ? (
          <Text
            style={[
              styles.text,
              { color: _getCurrentDayColor(item, timezone) },
            ]}
          >
            {!RTL()
              ? `${item.firstOpenHour} - ${item.firstCloseHour}`
              : ` ${item.firstCloseHour} - ${item.firstOpenHour}`}
          </Text>
        ) : (
          <Text style={styles.dayOff}>{dayOff}</Text>
        )}

        {item.firstOpenHour &&
          item.firstCloseHour &&
          item.secondOpenHour &&
          item.secondCloseHour && <View style={{ width: 15 }} />}

        {item.secondOpenHour && item.secondCloseHour && (
          <Text
            style={[
              styles.text,
              { color: _getCurrentDayColor(item, timezone) },
            ]}
          >
            {!RTL()
              ? `${item.secondOpenHour} - ${item.secondCloseHour}`
              : ` ${item.secondCloseHour} - ${item.secondOpenHour}`}
          </Text>
        )}
      </View>
    </View>
  );
};

const AlwayOpenItem = (props) => (
  <View
    style={{
      padding: 10,
      backgroundColor: Consts.colorSecondary,
      flexDirection: "column",
      alignItems: "center",
      borderRadius: Consts.round,
    }}
  >
    <Text
      style={{
        color: "#fff",
        fontSize: 13,
      }}
    >
      {props.alwaysOpenText}
    </Text>
  </View>
);

const ListingHours = (props) => {
  const { data, alwaysOpenText, dayOff, translations } = props;
  const { mode } = data;
  switch (mode) {
    case "open_for_selected_hours":
      const { operating_times, timezone } = data;
      return (
        <View>
          {operating_times &&
            !isEmpty(operating_times) &&
            operating_times.map(renderItem(timezone, dayOff, translations))}
        </View>
      );
    case "always_open":
      return <AlwayOpenItem alwaysOpenText={alwaysOpenText} />;
    default:
      return null;
  }
};

ListingHours.propTypes = {
  currentDay: PropTypes.object,
  data: PropTypes.object,
};

const styles = StyleSheet.create({
  spaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: {
    color: Consts.colorDark2,
    fontSize: 11,
  },
  dayOff: {
    color: Consts.colorQuaternary,
    alignSelf: "flex-end",
    fontWeight: "500",
    fontSize: 11,
  },
});

export default ListingHours;
