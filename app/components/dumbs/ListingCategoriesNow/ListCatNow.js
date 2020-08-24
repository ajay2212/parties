import React, { PureComponent } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import PropTypes from "prop-types";
import {
  screenWidth,
  colorDark1,
  colorGray1,
  round,
  colorGray3,
} from "../../../constants/styleConstants";
import { Row, Col, ImageCover, FontIcon } from "../../../wiloke-elements";
import _ from "lodash";
import he from "he";

export default class ListCatNow extends PureComponent {
  static propTypes = {
    cat: PropTypes.array,
    containerStyle: PropTypes.object,
  };

  mapDataToCategories = () => {
    const { cat } = this.props;
    const res = cat
      .reduce((newArr, item, index) => {
        const length = cat.length;
        let catDouble = [];
        if (index <= length - 1) {
          if (index % 2 === 0) {
            catDouble = !!cat[index + 1]
              ? [cat[index], cat[index + 1]]
              : [cat[index]];
          }
        }
        return [...newArr, catDouble];
      }, [])
      .filter((i) => !_.isEmpty(i));
    return res;
  };

  _handleItem = (item) => () => {
    const { navigation } = this.props;
    navigation.navigate("ListingCategories", {
      categoryId: item.oTerm.term_id,
      name: he.decode(item.oTerm.name),
      taxonomy: item.taxonomy,
      endpointAPI: item.restAPI,
    });
  };

  _renderCatItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        style={[styles.catItem, index === 0 && { paddingBottom: 20 }]}
        onPress={this._handleItem(item)}
      >
        <View style={styles.box}>
          <FontIcon
            name={item.oIcon.icon ? item.oIcon.icon : "la la-cutlery"}
            color={item.oIcon.color ? item.oIcon.color : "#f95524"}
            size={20}
          />
        </View>
        <Text style={styles.name}>{he.decode(item.oTerm.name)}</Text>
      </TouchableOpacity>
    );
  };

  renderItem = ({ item, index }) => {
    return (
      <View
        style={[styles.item, { width: screenWidth / 4 - 10, height: "100%" }]}
      >
        <FlatList
          data={item}
          renderItem={this._renderCatItem}
          keyExtractor={(item, index) => index.toString() + "__categoryItem"}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      </View>
    );
  };

  render() {
    const { cat, containerStyle } = this.props;
    const data = this.mapDataToCategories();
    return (
      <View style={[containerStyle]}>
        <FlatList
          data={data}
          renderItem={this.renderItem}
          keyExtractor={(item, index) => index.toString() + "__category"}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
        />
      </View>
    );
  }
}
const styles = StyleSheet.create({
  item: {
    marginHorizontal: 10,
  },
  box: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colorGray1,
    borderRadius: 5,
    width: 60,
    height: 60,
  },
  catItem: {
    alignItems: "center",
  },
  name: {
    fontSize: 12,
    paddingTop: 10,
    fontWeight: "500",
  },
});
