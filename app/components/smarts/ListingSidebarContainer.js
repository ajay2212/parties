import React, { Component } from "react";
import PropTypes from "prop-types";
import { View, Text } from "react-native";
import _ from "lodash";
import he from "he";
import { connect } from "react-redux";
import { WebView } from "react-native-webview";
import moment from "moment";
import momentTimeZone from "moment-timezone";

import { getListingSidebar } from "../../actions";
import {
  ViewWithLoading,
  ContentBox,
  RequestTimeoutWrapped,
  P,
  HtmlViewer,
  Loader,
  Uppercasewords,
  getBusinessDay,
  getBusinessStatus,
} from "../../wiloke-elements";
import * as Consts from "../../constants/styleConstants";
import {
  ListingHours,
  ListingBusinessInfo,
  PriceRange,
  ListingCatList,
  ListingStatistic,
  ListingTagList,
  ListingCoupon,
  ListingProductClassic,
  ListingProduct,
  WilWebView,
} from "../dumbs";

class ListingSidebarContainer extends Component {
  static propTypes = {
    navigation: PropTypes.object,
  };

  _getListingSidebar = () => {
    const {
      getListingSidebar,
      listingId,
      listingDetail,
      listingSidebar,
    } = this.props;
    getListingSidebar(listingId);
  };
  componentDidMount() {
    this._getListingSidebar();
  }

  // _getIcon = key => {
  //   switch (key) {
  //     case "businessHours":
  //       return "clock";
  //     case "categories":
  //       return "layers";
  //     case "statistic":
  //       return "bar-chart-2";
  //     case "tags":
  //       return "tag";
  //     case "businessInfo":
  //       return "repeat";
  //     default:
  //       return "check-circle";
  //   }
  // };

  _checkItemContent = (item) => {
    const { navigation, translations, settings } = this.props;
    switch (item.aSettings.key) {
      case "businessHours":
        return (
          <ListingHours
            data={item.oContent}
            alwaysOpenText={translations.always_open}
            dayOff={translations.dayOff}
            translations={translations}
          />
        );
      case "priceRange":
        return (
          <View>
            {!!item.oContent.desc && (
              <P style={{ paddingBottom: 5, textAlign: "left" }}>
                {item.oContent.desc}
              </P>
            )}
            <PriceRange
              data={item.oContent}
              colorPrimary={settings.colorPrimary}
            />
          </View>
        );
      case "categories":
        return <ListingCatList data={item.oContent} navigation={navigation} />;
      case "statistic":
        return (
          <ListingStatistic data={item.oContent} navigation={navigation} />
        );
      case "wilcity_single_sidebar_my_checkbox2_field":
      case "wilcity_single_sidebar_my_select_field":
      case "tags":
        if (!_.isArray(item.oContent)) {
          return null;
        }
        return <ListingTagList data={item.oContent} navigation={navigation} />;
      case "businessInfo":
        return (
          <ListingBusinessInfo data={item.oContent} navigation={navigation} />
        );
      case "coupon":
        return (
          <ListingCoupon
            data={item.oContent}
            translations={translations}
            colorPrimary={settings.colorPrimary}
          />
        );
      // case "myProducts":
      //   return (
      //     <ListingProductClassic
      //       data={item.oContent}
      //       aSettings={item.aSettings}
      //       translations={translations}
      //       navigation={navigation}
      //       auth={this.props.auth}
      //       colorPrimary={settings.colorPrimary}
      //     />
      //   );
      // case "woocommerceBooking":
      //   return item.aSettings.style === "listPersons" ? (
      //     <ListingProduct
      //       data={item.oContent}
      //       aSettings={item.aSettings}
      //       translations={translations}
      //       navigation={navigation}
      //       auth={this.props.auth}
      //       colorPrimary={settings.colorPrimary}
      //     />
      //   ) : (
      //     <ListingProductClassic
      //       data={item.oContent}
      //       aSettings={item.aSettings}
      //       translations={translations}
      //       navigation={navigation}
      //       auth={this.props.auth}
      //       colorPrimary={settings.colorPrimary}
      //     />
      //   );
      // case "wilcity_single_sidebar_image":
      // case "wilcity_single_sidebar_my_textarea_field":
      //   return (
      //     <View style={{ marginLeft: -10 }}>
      //       <HtmlViewer
      //         html={item.oContent}
      //         htmlWrapCssString={`font-size: 13px; color: ${
      //           Consts.colorDark2
      //         }; line-height: 1.4em`}
      //         containerMaxWidth={Consts.screenWidth - 22}
      //         containerStyle={{ paddingLeft: 10, paddingRight: 0 }}
      //       />
      //     </View>
      //   );
      case "singlePrice":
        return (
          <View>
            {item.oContent.currencyPos === "left" ? (
              <Text
                style={{
                  fontSize: 26,
                  padding: 7,
                  color: settings.colorPrimary,
                }}
              >
                {he.decode(item.oContent.currencySymbol)}
                {item.oContent.price}
              </Text>
            ) : (
              <Text
                style={{
                  fontSize: 26,
                  padding: 7,
                  color: settings.colorPrimary,
                }}
              >
                {item.oContent.price}
                {he.decode(item.oContent.currencySymbol)}
              </Text>
            )}
          </View>
        );
      default:
        return item.aSettings.isWebView ? (
          <View style={{ marginLeft: -10, paddingVertical: 20 }}>
            <WebView
              source={{ html: `${item.oContent}` }}
              originWhitelist={["https://*", "git://*"]}
              startInLoadingState={true}
              renderLoading={() => <Loader />}
              renderError={(err) => console.log("errooorr", err)}
              useWebKit={true}
            />
          </View>
        ) : (
          <View style={{ marginLeft: -10 }}>
            <HtmlViewer
              html={item.oContent}
              htmlWrapCssString={`font-size: 13px; color: ${Consts.colorDark2}; line-height: 1.4em`}
              containerMaxWidth={Consts.screenWidth - 22}
              containerStyle={{ paddingLeft: 10, paddingRight: 0 }}
            />
          </View>
        );
    }
  };

  _getTextBussiness = (isOpen) => {
    const { translations } = this.props;
    switch (isOpen) {
      case true:
        return translations.open;
      case "day_off":
        return translations.dayOff;
      default:
        return translations.closed;
    }
  };

  renderStatusHours = (item, zone) => {
    const { translations } = this.props;
    if (!item.oContent.operating_times) {
      return (
        <Text
          style={{
            fontSize: 12,
            color: Consts.colorQuaternary,
          }}
        >
          {translations.dayOff}
        </Text>
      );
    }
    const isOpen = getBusinessStatus(item.oContent.operating_times, zone);

    return (
      <View
        style={{
          borderWidth: 1,
          borderColor:
            !isOpen || isOpen === "day_off"
              ? Consts.colorQuaternary
              : Consts.colorSecondary,
          borderRadius: 2,
          paddingVertical: 3,
          paddingHorizontal: 8,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color:
              !isOpen || isOpen === "day_off"
                ? Consts.colorQuaternary
                : Consts.colorSecondary,
          }}
        >
          {this._getTextBussiness(isOpen)}
        </Text>
      </View>
    );
  };

  renderItem = (item, index) => {
    const { settings } = this.props;
    if (typeof item === "object") {
      const { key, name, icon } = item.aSettings;
      if (
        key === "tải_ứng_dụng_icare-plus.vn" ||
        key === "co_the_ban_quan_tam"
      ) {
        return false;
      }
      if (!item.oContent) {
        return null;
      }
      return (
        <ContentBox
          key={index.toString()}
          headerTitle={name ? name : ""}
          headerIcon={icon}
          showHeader={item.aSettings.key !== "coupon"}
          renderRight={() => {
            return item.oContent.mode === "open_for_selected_hours" &&
              key === "businessHours"
              ? this.renderStatusHours(item, item.oContent.timezone)
              : null;
          }}
          style={{ marginBottom: 10 }}
          colorPrimary={settings.colorPrimary}
        >
          {this._checkItemContent(item)}
        </ContentBox>
      );
    }
  };

  render() {
    const {
      listingSidebar,
      isListingDetailSidebarRequestTimeout,
      translations,
      navigation,
      listingId,
    } = this.props;
    if (listingSidebar[listingId] === "__empty__") {
      return null;
    }
    return (
      <RequestTimeoutWrapped
        isTimeout={isListingDetailSidebarRequestTimeout}
        onPress={this._getListingSidebar}
        text={translations.networkError}
        buttonText={translations.retry}
      >
        <ViewWithLoading
          isLoading={_.isEmpty(listingSidebar[listingId])}
          contentLoader="contentHeader"
          contentLoaderItemLength={1}
        >
          {!_.isEmpty(listingSidebar[listingId]) &&
            listingSidebar[listingId].map(this.renderItem)}
        </ViewWithLoading>
      </RequestTimeoutWrapped>
    );
  }
}

const mapStateToProps = (state) => ({
  listingSidebar: state.listingSidebar,
  translations: state.translations,
  isListingDetailSidebarRequestTimeout:
    state.isListingDetailSidebarRequestTimeout,
  settings: state.settings,
  auth: state.auth,
  listingDetail: state.listingDetail,
});

export default connect(mapStateToProps, { getListingSidebar })(
  ListingSidebarContainer
);
