import React, { PureComponent } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { withNavigationFocus } from "react-navigation";
import { Feather } from "@expo/vector-icons";
import { connect } from "react-redux";
import _ from "lodash";
import * as WebBrowser from "expo-web-browser";
import * as Consts from "../../constants/styleConstants";
import NavigationSuspense from "../smarts/NavigationSuspense";
import {
  ActionSheet,
  Row,
  Col,
  Modal,
  bottomBarHeight,
  P,
  InputMaterial,
  ModalPicker,
  Toast,
  Button,
  Loader,
  isCloseToBottom,
  ViewWithLoading,
  FontIcon,
  Admob,
  Communications,
  RTL,
  wait,
  getTotalQuantity,
} from "../../wiloke-elements";
import { ParallaxListingScreen, ButtonFooterContentBox } from "../dumbs";
import {
  ListingDescriptionContainer,
  ListingListFeatureContainer,
  ListingPhotosContainer,
  ListingReviewsContainer,
  ListingDetailNavContainer,
  ListingEventsContainer,
  ListingVideosContainer,
  ListingSidebarContainer,
  AverageDetailReviewContainer,
  ListingResMenuContainer,
  ListingProductContainer,
  ListingProductContainer2,
} from "../smarts";
import {
  getListingDetail,
  addMyFavorites,
  getReportForm,
  postReport,
  getKeyFirebase,
  messageChatActive,
  getListingReviewsLoadmore,
  changeListingDetailNavigation,
  getScrollTo,
  getListingReviews,
} from "../../actions";
import ListingCustomSectionContainer from "../smarts/ListingCustomSectionContainer";
import ListingArticleContainer from "../smarts/ListingArticleContainer";
import ListingProductMultiple from "../smarts/ListingProductMultiple";
import ListingTaxonomyContainer from "../smarts/ListingTaxonomyContainer";
import ListingCouponContainer from "../smarts/ListingCouponContainer";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
class ListingDetailScreen extends PureComponent {
  state = {
    isReviews: true,
    isTabReviews: true,
    isVisibleReport: false,
    report: {},
    isLoadingReport: true,
    startReviewLoadmore: false,
    isFetch: false,
    isLoadMoreReview: true,
    isLoadingFavorite: false,
    animatedValue: new Animated.Value(0),
  };
  async componentDidMount() {
    const { navigation, getListingDetail } = this.props;
    const { params } = navigation.state;
    const { id } = params;
    await getListingDetail(params.id);
    const { listingDetail } = this.props;
    this.setState({
      isReviews:
        !_.isEmpty(listingDetail[id].oHomeSections) &&
        Object.values(listingDetail[id].oHomeSections)
          .map((item) => item.baseKey)
          .includes("reviews"),
      isTabReviews:
        !_.isEmpty(listingDetail[id].oNavigation) &&
        Object.values(listingDetail[id].oNavigation)
          .map((item) => item.baseKey)
          .includes("reviews"),

      startReviewLoadmore: true,
    });
  }

  componentDidUpdate(prevProps) {
    const { navigation } = this.props;
    const { id } = navigation.state.params;
    if (
      !_.isEqual(
        prevProps.listingReviewsAll[id],
        this.props.listingReviewsAll[id]
      )
    ) {
      this.setState({
        isFetch: true,
      });
    }
    if (!_.isEqual(prevProps.listingDetailNav, this.props.listingDetailNav)) {
      const { scrollTo } = this.props;
      this._timeout = setTimeout(
        () =>
          this._scrollView
            .getNode()
            .scrollTo({ x: 0, y: scrollTo, animated: false }),
        1
      );
    }
  }

  componentWillUnmount() {
    this._timeout && clearTimeout(this._timeout);
  }

  _hide = (key) => {
    if (key) {
      return {};
    }
    return {
      opacity: 0,
      display: "none",
      // position: "absolute",
      // bottom: "100%",
      // zIndex: -999
    };
  };

  _renderAdmob = ({ oBanner }) => {
    return <View>{oBanner && <Admob {...oBanner} />}</View>;
  };

  renderHeaderLeft = () => {
    const { navigation } = this.props;
    const rtl = RTL();
    return (
      <TouchableOpacity activeOpacity={0.5} onPress={() => navigation.goBack()}>
        <View style={styles.headerLeft}>
          <Feather
            name={rtl ? "chevron-right" : "chevron-left"}
            size={26}
            color="#fff"
          />
        </View>
      </TouchableOpacity>
    );
  };

  renderHeaderCenter = () => {
    const { navigation } = this.props;
    const { params } = navigation.state;
    return (
      <Text style={{ color: "#fff" }} numberOfLines={1}>
        {params.name}
      </Text>
    );
  };

  _handleWriteReview = () => {
    const { auth, navigation, listingDetail } = this.props;
    const { isTabReviews, isReviews } = this.state;
    const { isLoggedIn } = auth;
    const { params } = navigation.state;
    if (isTabReviews || isReviews) {
      isLoggedIn
        ? navigation.navigate("ReviewFormScreen", {
            mode: listingDetail[params.id].oReviews.mode,
            id: params.id,
          })
        : this._handleAccountScreen();
    }
  };

  _handleReportForm = async () => {
    this.setState({ isVisibleReport: true });
    await this.props.getReportForm();
    this.setState({ isLoadingReport: false });
  };

  _handleReportFormBackdropPress = () => {
    this.setState({ isVisibleReport: false });
  };

  _handlePostReport = (id) => async () => {
    await this.props.postReport(id, this.state.report);
    setTimeout(() => {
      this._toast.show(this.props.reportMessage, 3000);
    }, 500);
  };

  _handleReviewsLoadmore = async () => {
    const {
      navigation,
      listingReviewsAll,
      getListingReviewsLoadmore,
    } = this.props;
    const { id } = navigation.state.params;
    const { next } = listingReviewsAll;
    const { startReviewLoadmore } = this.state;
    this.setState({
      isFetch: false,
    });
    !!next &&
      startReviewLoadmore &&
      this.state.isFetch &&
      (await getListingReviewsLoadmore(id, next));
    this.setState({
      isFetch: true,
    });
  };

  _isKey = (k) => (nav) => {
    const navCurrent = nav.filter((item) => item.current);
    const { key } = navCurrent[0];
    return key === k;
  };

  _handleMomentumScrollEnd = ({ nativeEvent }) => {
    const { listingDetailNav } = this.props;
    const flatten = this._isKey("reviews")(listingDetailNav);
    isCloseToBottom(nativeEvent) && flatten && this._handleReviewsLoadmore();
  };

  _handleViewAllReviews = (id) => () => {
    this.props.changeListingDetailNavigation("reviews");
    this.props.getListingReviews(id, "reviews", null);
    this.props.getScrollTo(0);
  };

  _actionSheetMoreOptions = () => {
    const { translations, auth, listingDetail, navigation } = this.props;
    const { params } = navigation.state;
    const { id } = params;
    const { isLoggedIn } = auth;
    const isReview = _.get(
      listingDetail,
      `${id}.oReviews.isEnableReview`,
      false
    );
    const isReport = _.get(listingDetail, `${id}.isReport`, false);
    const phoneNumber = this._getPhoneNumber();
    const options = [
      translations.cancel,
      translations.inbox,
      translations.share,
      ...(!!phoneNumber ? [translations.callUs] : []),
      ...(isReview ? [translations.addReview] : []),
      ...(isReport ? [translations.report] : []),
    ];
    const _destructiveButtonIndex = isReview ? 5 : 4;
    const destructiveButtonIndex = !!phoneNumber
      ? _destructiveButtonIndex
      : _destructiveButtonIndex - 1;
    return {
      options,
      destructiveButtonIndex: destructiveButtonIndex,
      cancelButtonIndex: 0,
      onAction: (buttonIndex) => {
        switch (options[buttonIndex]) {
          case translations.inbox:
            isLoggedIn ? this._handleInbox() : this._handleAccountScreen();
            break;
          case translations.share:
            this._handleShare();
            break;
          case translations.callUs:
            this._handlePhoneCall(phoneNumber);
            break;
          case translations.addReview:
            this._handleWriteReview();
            break;
          case translations.report:
            this._handleReportForm();
            break;
          default:
            break;
        }
      },
    };
  };

  renderHeaderRight = () => {
    return (
      <ActionSheet
        {...this._actionSheetMoreOptions()}
        renderButtonItem={() => (
          <View style={styles.headerRight}>
            <Feather name="more-horizontal" size={24} color="#fff" />
          </View>
        )}
      />
    );
  };

  _handleShare = () => {
    const { navigation } = this.props;
    const { link } = navigation.state.params;
    Share.share(
      {
        ...Platform.select({
          ios: {
            message: "",
            url: link,
          },
          android: {
            message: link,
          },
        }),
        // title: "Wow, did you see that?"
      }
      // {
      //   ...Platform.select({
      //     ios: {
      //       // iOS only:
      //       excludedActivityTypes: ["com.apple.UIKit.activity.PostToTwitter"]
      //     },
      //     android: {
      //       // Android only:
      //       dialogTitle: "Share : " + "this.props.title"
      //     }
      //   })
      // }
    );
  };

  _handleInbox = async () => {
    const {
      navigation,
      getKeyFirebase,
      shortProfile,
      messageChatActive,
      listingDetail,
    } = this.props;
    const { params } = navigation.state;
    const { id: listingID } = params;
    const { oAuthor } = listingDetail[listingID];
    const { ID: userID, displayName } = oAuthor;
    const myID = shortProfile.userID;
    if (myID.toString() !== userID.toString()) {
      await getKeyFirebase(myID, userID);
      const { keyFirebase } = this.props;
      !!keyFirebase && messageChatActive(myID, keyFirebase, true);
      navigation.navigate("SendMessageScreen", {
        userID: Number(userID),
        displayName,
        key: keyFirebase,
      });
    } else {
      Alert.alert("You can't chat with yourself");
    }
  };

  _handleAddFavorite = async () => {
    const { navigation, addMyFavorites } = this.props;
    const { id } = navigation.state.params;
    this.setState({
      isLoadingFavorite: true,
    });
    await addMyFavorites(id);
    this.setState({
      isLoadingFavorite: false,
    });
  };

  _renderReportFormItem = (item) => {
    const { settings, translations } = this.props;
    switch (item.type) {
      case "text":
        return (
          <InputMaterial
            key={item.key}
            placeholder={item.label}
            colorPrimary={settings.colorPrimary}
            onChangeText={(text) => {
              this.setState({
                report: {
                  ...this.state.report,
                  [item.key]: text,
                },
              });
            }}
          />
        );
      case "select":
        return (
          <ModalPicker
            key={item.key}
            label={item.label}
            options={item.options}
            cancelText={translations.cancel}
            matterial={true}
            colorPrimary={settings.colorPrimary}
            onChangeOptions={(name, isChecked) => {
              this.setState({
                report: {
                  ...this.state.report,
                  [item.key]: isChecked.length > 0 ? isChecked[0].id : "",
                },
              });
            }}
          />
        );
      case "textarea":
        return (
          <InputMaterial
            key={item.key}
            placeholder={item.label}
            multiline={true}
            numberOfLines={4}
            colorPrimary={settings.colorPrimary}
            onChangeText={(text) => {
              this.setState({
                report: {
                  ...this.state.report,
                  [item.key]: text,
                },
              });
            }}
          />
        );
      default:
        return false;
    }
  };

  _handleAccountScreen = () => {
    const { translations, navigation } = this.props;
    Alert.alert(translations.login, translations.requiredLogin, [
      {
        text: translations.cancel,
        style: "cancel",
      },
      {
        text: translations.continue,
        onPress: () => navigation.navigate("AccountScreen"),
      },
    ]);
  };

  _handleButtonLarge = (link) => () => {
    if (/^\d+$/.test(link)) {
      this._handlePhoneCall(link);
      return;
    }
    !!link && link !== "#" && WebBrowser.openBrowserAsync(link);
  };

  _handlePhoneCall = (phoneNumber) => {
    Communications.phonecall(phoneNumber, true);
  };

  _getPhoneNumber = () => {
    const { listingSidebar, navigation } = this.props;
    const { params } = navigation.state;
    if (
      listingSidebar[params.id] === "__empty__" ||
      !listingSidebar[params.id]
    ) {
      return "";
    }
    return listingSidebar[params.id].reduce((str, item) => {
      if (item.aSettings.key === "businessInfo") {
        return item.oContent.phone;
      }
      return str;
    }, "");
  };

  renderDetailButtonLarge = () => {
    const { listingDetail, settings, navigation } = this.props;
    const { params } = navigation.state;
    const { id } = params;
    const oButton = _.get(listingDetail, `${id}.oButton`, {});
    return (
      !_.isEmpty(oButton) &&
      !_.isEmpty(listingDetail) && (
        <TouchableOpacity
          style={[
            styles.buttonLargeContent,
            { backgroundColor: settings.colorPrimary },
          ]}
          activeOpacity={0.7}
          onPress={this._handleButtonLarge(oButton.link)}
        >
          <FontIcon name={oButton.icon} color="#fff" size={18} />
          <View style={{ width: 6 }} />
          <Text style={styles.buttonText}>{oButton.name}</Text>
        </TouchableOpacity>
      )
    );
  };

  renderActions = () => {
    const {
      navigation,
      listIdPostFavorites,
      listIdPostFavoritesRemoved,
      settings,
      translations,
      reportForm,
      listingDetail,
      auth,
    } = this.props;

    const { isLoggedIn } = auth;
    const { id } = navigation.state.params;
    const oFavorite = _.get(listingDetail, `${id}.oFavorite`, {});
    const listIdPostFavoritesFilter = listIdPostFavorites.filter(
      (item) => item.id === id
    );

    const isListingFavorite =
      !_.isEmpty(listingDetail[id]) &&
      !!oFavorite.isMyFavorite &&
      oFavorite.isMyFavorite !== "no";

    const condition =
      listIdPostFavoritesFilter.length > 0 ||
      (listIdPostFavoritesFilter.length > 0 &&
        !_.isEmpty(listingDetail) &&
        isListingFavorite) ||
      (listIdPostFavoritesRemoved.length === 0 && isListingFavorite);
    const isReport = _.get(listingDetail, `${id}.isReport`, false);
    const phoneNumber = this._getPhoneNumber();
    const _column = isReport ? 5 : 4;
    const column = !!phoneNumber ? _column : _column - 1;
    return (
      <View style={styles.actionWrap}>
        <Row>
          <Col column={column}>
            {this.state.isLoadingFavorite ? (
              <View style={{ marginTop: 10 }}>
                <ActivityIndicator size="small" color={Consts.colorDark3} />
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={
                  isLoggedIn
                    ? this._handleAddFavorite
                    : this._handleAccountScreen
                }
                style={styles.actionItem}
              >
                <Feather
                  name="heart"
                  size={22}
                  color={
                    condition && isLoggedIn
                      ? Consts.colorQuaternary
                      : Consts.colorDark3
                  }
                />

                <View style={{ height: 4 }} />
                <Text
                  style={{
                    color: condition
                      ? Consts.colorQuaternary
                      : Consts.colorDark2,
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  {translations.favorite}
                </Text>
              </TouchableOpacity>
            )}
          </Col>
          <Col column={column}>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={this._handleShare}
              style={styles.actionItem}
            >
              <Feather name="share" size={22} color={Consts.colorDark3} />
              <View style={{ height: 4 }} />
              <Text
                style={{
                  color: Consts.colorDark2,
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                {translations.share}
              </Text>
            </TouchableOpacity>
          </Col>
          {isReport && (
            <Col column={column}>
              <Modal
                isVisible={this.state.isVisibleReport}
                headerIcon="alert-triangle"
                headerTitle={translations.report}
                colorPrimary={settings.colorPrimary}
                cancelText={translations.cancel}
                submitText={translations.submit}
                onBackdropPress={this._handleReportFormBackdropPress}
                renderButtonTextToggle={() => (
                  <View style={styles.actionItem}>
                    <Feather
                      name="alert-triangle"
                      size={22}
                      color={Consts.colorDark3}
                    />
                    <View style={{ height: 4 }} />
                    <Text
                      style={{
                        color: Consts.colorDark2,
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      {translations.report}
                    </Text>
                  </View>
                )}
                onButtonTextToggle={this._handleReportForm}
                onSubmitAsync={this._handlePostReport(id)}
              >
                {this.state.isLoadingReport ? (
                  <View style={{ height: 100 }}>
                    <Loader size="small" height={100} />
                  </View>
                ) : (
                  <View>
                    {!_.isEmpty(reportForm) ? (
                      typeof reportForm !== "string" ? (
                        <View>
                          <P>{reportForm.description}</P>
                          {!_.isEmpty(reportForm.aFields) &&
                            reportForm.aFields.map(this._renderReportFormItem)}
                        </View>
                      ) : (
                        <P>{reportForm}</P>
                      )
                    ) : null}
                  </View>
                )}
              </Modal>
            </Col>
          )}
          <Col column={column}>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={
                isLoggedIn ? this._handleInbox : this._handleAccountScreen
              }
              style={styles.actionItem}
            >
              <Feather
                name="message-square"
                size={22}
                color={Consts.colorDark3}
              />
              <View style={{ height: 4 }} />
              <Text
                style={{
                  color: Consts.colorDark2,
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                {translations.inbox}
              </Text>
            </TouchableOpacity>
          </Col>
          {!!phoneNumber && (
            <Col column={column}>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => this._handlePhoneCall(phoneNumber)}
                style={styles.actionItem}
              >
                <Feather name="phone" size={22} color={Consts.colorDark3} />
                <View style={{ height: 4 }} />
                <Text
                  style={{
                    color: Consts.colorDark2,
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  {translations.callUs}
                </Text>
              </TouchableOpacity>
            </Col>
          )}
        </Row>
      </View>
    );
  };

  /**
   * ListingDescriptionContainer
   * @param {string} type hiển thị tất cả hay là những item mới nhất
   * @param {number} id id của bài viết
   */
  renderDescription = (type) => (id, item, max) => (
    <ListingDescriptionContainer
      key={item.key}
      params={{ id, item, max }}
      type={type}
    />
  );

  renderListFeatures = (type) => (id, item, max) => (
    <ListingListFeatureContainer
      key={item.key}
      params={{ id, item, max }}
      type={type}
      navigation={this.props.navigation}
    />
  );

  renderPhotos = (type) => (id, item, max) => (
    <ListingPhotosContainer
      key={item.key}
      params={{ id, item, max }}
      type={type}
    />
  );

  renderReviews = (type) => (id, item, max) => {
    const {
      navigation,
      settings,
      listingDetail,
      listingDetailNav,
      translations,
      listingReviewsAll,
      listingReviews,
    } = this.props;
    const { isTabReviews, isLoadMoreReview } = this.state;
    const { next } = listingReviewsAll;
    // check tat review o setting
    const isReview = _.get(
      listingDetail,
      `${id}.oReviews.isEnableReview`,
      false
    );
    const oReviews = _.get(listingDetail, `${id}.oReviews`, {});
    const isAverage = !_.isEmpty(oReviews) && oReviews.averageReview !== 0;
    return (
      <View key={item.key}>
        {isTabReviews &&
          isAverage &&
          type !== null &&
          this.renderAverageRating()}

        {isReview && (
          <View style={{ marginBottom: 10 }}>
            <Button
              size="lg"
              block={true}
              backgroundColor="primary"
              radius="round"
              style={styles.button}
              onPress={this._handleWriteReview}
              colorPrimary={settings.colorPrimary}
            >
              {translations.addReview}
            </Button>
          </View>
        )}

        <ListingReviewsContainer
          navigation={navigation}
          params={{ id, item, max }}
          type={type}
          colorPrimary={settings.colorPrimary}
        />
        {this._isKey("reviews")(listingDetailNav) && !!next && (
          <ViewWithLoading
            isLoading={isLoadMoreReview}
            contentLoader="contentHeaderAvatar"
            contentLoaderItemLength={1}
          />
        )}
        {this._isKey("home")(listingDetailNav) &&
          !_.isEmpty(listingReviews[`${id}`]) &&
          isTabReviews && (
            <View style={styles.buttonFooterContentBox}>
              <ButtonFooterContentBox
                text={translations.seeMoreReview.toUpperCase()}
                onPress={this._handleViewAllReviews(id)}
              />
            </View>
          )}
      </View>
    );
  };

  renderEvents = (type) => (id, item, max) => {
    const { navigation } = this.props;
    return (
      <ListingEventsContainer
        key={item.key}
        navigation={navigation}
        params={{ id, item, max }}
        type={type}
      />
    );
  };

  renderVideos = (type) => (id, item, max) => (
    <ListingVideosContainer
      key={item.key}
      params={{ id, item, max }}
      type={type}
    />
  );

  renderRestaurantMenu = (type) => (id, item) => (
    <ListingResMenuContainer key={item.key} params={{ id, item }} type={type} />
  );

  renderProducts = (type) => (id, item, max) => (
    <ListingProductContainer
      key={item.key}
      params={{ id, item, max }}
      type={type}
      navigation={this.props.navigation}
    />
  );
  rendeAdvacedProduct = (type) => (id, item, max) => {
    if (item.variant === "single_selection") {
      return (
        <ListingProductContainer2
          key={item.key}
          params={{ id, item, max }}
          type={type}
          navigation={this.props.navigation}
        />
      );
    }
    if (item.variant === "multiple_selection") {
      return (
        <ListingProductMultiple
          key={item.key}
          params={{ id, item, max }}
          type={type}
          navigation={this.props.navigation}
        />
      );
    }
  };

  renderWebView = (type) => (id, item) => {
    return null;
  };

  renderCustomSection = (type) => (id, item) => {
    return (
      <ListingCustomSectionContainer
        key={item.key}
        params={{ id, item }}
        type={type}
        navigation={this.props.navigation}
      />
    );
  };

  renderAritcle = (type) => (id, item, max) => {
    const { navigation } = this.props;
    return (
      <ListingArticleContainer
        key={item.key}
        navigation={navigation}
        params={{ id, item, max }}
        type={type}
      />
    );
  };

  renderTaxonomy = (type) => (id, item, max) => {
    const { navigation } = this.props;
    return (
      <ListingTaxonomyContainer
        key={item.key}
        navigation={navigation}
        params={{ id, item, max }}
        type={type}
      />
    );
  };

  renderCoupon = (type) => (id, item, max) => {
    const { navigation } = this.props;
    return (
      <ListingCouponContainer
        key={item.key}
        navigation={navigation}
        params={{ id, item, max }}
        type={type}
      />
    );
  };

  _checkRenderDetailBox = (id, item, index) => {
    const { baseKey, maximumItemsOnHome: max } = item;
    switch (baseKey) {
      case "content":
      case "text":
        return this.renderDescription(null)(id, item, max);
      case "tags":
      case "boxIcon":
        return this.renderListFeatures(null)(id, item, max);
      case "photos":
        return this.renderPhotos(null)(id, item, max);
      case "reviews":
        return this.renderReviews(null)(id, item, max);
      case "events":
        return this.renderEvents(null)(id, item, max);
      case "videos":
        return this.renderVideos(null)(id, item, max);
      case "webview":
        return this.renderWebView(null)(id, item, max);
      case "restaurant_menu":
        return this.renderRestaurantMenu(null)(id, item);
      case "custom_section":
        return this.renderCustomSection(null)(id, item);
      case "posts":
        return this.renderAritcle(null)(id, item, max);
      case "my_products":
        return this.renderProducts(null)(id, item, max);
      case "my_advanced_products":
        return this.rendeAdvacedProduct(null)(id, item, max);
      case "taxonomy":
        return this.renderTaxonomy(null)(id, item, max);
      case "coupon":
        return this.renderCoupon(null)(id, item, max);
      default:
        return false;
    }
  };

  _checkRenderTabContent = (item, index) => {
    const { navigation } = this.props;
    const { params } = navigation.state;
    const { id } = params;
    switch (item.category) {
      case "home":
        return this.renderDetailHomeContent();
      case "content":
      case "text":
        return this.renderDescription("all")(id, item, null);
      case "tags":
      case "boxIcon":
        return this.renderListFeatures("all")(id, item, null);
      case "photos":
        return this.renderPhotos("all")(id, item, null);
      case "reviews":
        return this.renderReviews("all")(id, item, null);
      case "videos":
        return this.renderVideos("all")(id, item, null);
      case "events":
        return this.renderEvents("all")(id, item, null);
      case "restaurant_menu":
        return this.renderRestaurantMenu("all")(id, item);
      case "my_products":
        return this.renderProducts("all")(id, item, null);
      case "webview":
        return this.renderWebView("all")(id, item, null);
      case "custom_section":
        return this.renderCustomSection("all")(id, item, null);
      case "posts":
        return this.renderAritcle("all")(id, item, null);
      case "my_advanced_products":
        return this.rendeAdvacedProduct("all")(id, item, null);
      case "taxonomy":
        return this.renderTaxonomy("all")(id, item, null);
      case "coupon":
        return this.renderCoupon("all")(id, item, null);
      default:
        return false;
    }
  };

  renderAverageRating = () => {
    const { navigation } = this.props;
    return <AverageDetailReviewContainer navigation={navigation} />;
  };

  renderDetailHomeContent = () => {
    const { navigation, listingDetail, settings } = this.props;
    const { params } = navigation.state;
    const { id } = params;
    const { isReviews } = this.state;
    const oHomeSections = _.get(listingDetail, `${id}.oHomeSections`, {});
    const oReviews = _.get(listingDetail, `${id}.oReviews`, {});
    const isAverage = !_.isEmpty(oReviews) && oReviews.averageReview !== 0;
    return (
      <View>
        {isReviews && isAverage && this.renderAverageRating()}
        {settings.oSingleListing.contentPosition !== "above_sidebar" && (
          <ListingSidebarContainer
            listingId={params.id}
            navigation={navigation}
          />
        )}
        {!_.isEmpty(oHomeSections) &&
          Object.keys(oHomeSections).length > 0 &&
          Object.keys(oHomeSections).map((item, index) => {
            const _item = oHomeSections[item];
            return this._checkRenderDetailBox(id, _item, index);
          })}
        {settings.oSingleListing.contentPosition === "above_sidebar" && (
          <ListingSidebarContainer
            listingId={params.id}
            navigation={navigation}
          />
        )}
      </View>
    );
  };

  renderContent = () => {
    const { listingDetailNav, listingDetail, navigation } = this.props;
    const { params } = navigation.state;
    const { id } = params;
    const homeCurrent = listingDetailNav.filter(
      (item) => item.current && item.key === "home"
    ).length;
    const oAdmob = _.get(listingDetail, `${id}.oAdmob`, {});
    return (
      <View style={styles.contentWrapper}>
        <NavigationSuspense>
          {this.renderActions()}
          {!!homeCurrent && this.renderDetailButtonLarge()}
          <Toast ref={(c) => (this._toast = c)} />

          {!_.isEmpty(oAdmob) && (
            <View style={{ marginBottom: 10 }}>
              {this._renderAdmob(oAdmob)}
            </View>
          )}
        </NavigationSuspense>

        <View style={styles.aCenter}>
          <View style={styles.maxWidth}>
            {listingDetailNav.length > 0 &&
              listingDetailNav.map((item, index) => (
                <NavigationSuspense
                  key={index.toString()}
                  fallback={
                    <ViewWithLoading isLoading contentLoader="contentHeader" />
                  }
                >
                  <View
                    style={[
                      this._hide(item.current && true),
                      {
                        width: "100%",
                      },
                    ]}
                  >
                    {this._checkRenderTabContent(item, index)}
                  </View>
                </NavigationSuspense>
              ))}
          </View>
        </View>
      </View>
    );
  };

  renderNavigation = () => {
    const { navigation, translations, listingDetail, settings } = this.props;
    const { params } = navigation.state;
    const itemFirst = [
      {
        name: translations.home,
        category: "home",
        key: "home",
        icon: "home",
        current: true,
        loaded: true,
      },
    ];
    const oNavigation = _.get(listingDetail, `${params.id}.oNavigation`, {});
    const navArr = !_.isEmpty(oNavigation)
      ? Object.values(oNavigation).map((item) => ({
          ...item,
          name: item.name,
          category: item.baseKey,
          key: item.key,
          icon: item.icon,
          current: false,
          loaded: false,
        }))
      : [];
    const newData = [...itemFirst, ...navArr];
    return (
      <ListingDetailNavContainer
        data={newData}
        listingId={params.id}
        colorPrimary={settings.colorPrimary}
      />
    );
  };

  _handleGoToCart = () => {
    const { navigation } = this.props;
    navigation.navigate("CartScreen");
  };

  renderCheckoutCart = () => {
    const { myCart, settings } = this.props;
    const { animatedValue } = this.state;

    Animated.timing(animatedValue, {
      toValue: myCart.products.length > 0 ? 100 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    const transY = animatedValue.interpolate({
      inputRange: [0, 100],
      outputRange: [200, -50],
      extrapolate: "clamp",
    });
    const opacity = animatedValue.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [0, 0.4, 1],
      extrapolate: "clamp",
    });
    return (
      <AnimatedTouchable
        style={[
          styles.cart,
          {
            transform: [
              {
                translateY: transY,
              },
            ],
            opacity,
            backgroundColor: settings.colorPrimary,
          },
        ]}
        onPress={this._handleGoToCart}
      >
        <View style={styles.viewTotal}>
          <Text style={styles.textCart}>
            {getTotalQuantity(myCart.products)}
          </Text>
        </View>
        <FontIcon name="shopping-bag" color="#fff" size={20} />
      </AnimatedTouchable>
    );
  };

  render() {
    const { navigation, settings } = this.props;
    const { params } = navigation.state;
    return (
      <View style={{ flex: 1, position: "relative" }}>
        <ParallaxListingScreen
          scrollViewRef={(ref) => (this._scrollView = ref)}
          headerImageSource={params.image}
          logo={params.logo}
          title={params.name}
          tagline={!!params.tagline ? params.tagline : null}
          renderNavigation={this.renderNavigation}
          overlayRange={[0, 1]}
          overlayColor={settings.colorPrimary}
          renderHeaderLeft={this.renderHeaderLeft}
          renderHeaderCenter={this.renderHeaderCenter}
          renderHeaderRight={this.renderHeaderRight}
          renderContent={this.renderContent}
          navigation={navigation}
          onMomentumScrollEnd={this._handleMomentumScrollEnd}
        />
        {this.renderCheckoutCart()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  contentWrapper: {
    padding: 10,
    backgroundColor: Consts.colorGray2,
    marginBottom: bottomBarHeight,
    minHeight: Consts.screenHeight / 1.6,
  },
  aCenter: { alignItems: "center", marginBottom: 20 },
  maxWidth: { width: Consts.screenWidth - 20 },
  button: {
    paddingVertical: 0,
    height: 50,
    justifyContent: "center",
  },
  actionWrap: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Consts.colorGray1,
    paddingVertical: 15,
    paddingBottom: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
    marginTop: -10,
    marginHorizontal: -10,
  },
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonFooterContentBox: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 16,
    marginBottom: 10,
  },
  actionItem: {
    flexDirection: "column",
    alignItems: "center",
  },
  headerLeft: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonLargeContent: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    height: 50,
    borderRadius: 3,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  cart: {
    position: "absolute",
    right: 10,
    bottom: 0,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  viewTotal: {
    position: "absolute",
    top: 5,
    right: 5,
    color: "#333",
    width: 15,
    height: 15,
    backgroundColor: "#fff",
    borderRadius: 40,
    zIndex: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  textCart: {
    fontSize: 10,
    padding: 3,
    fontWeight: "bold",
  },
});

const mapStateToProps = (state) => ({
  listingDetailNav: state.listingDetailNav,
  listingDetail: state.listingDetail,
  translations: state.translations,
  scrollTo: state.scrollTo,
  settings: state.settings,
  listIdPostFavorites: state.listIdPostFavorites,
  listIdPostFavoritesRemoved: state.listIdPostFavoritesRemoved,
  reportForm: state.reportForm,
  auth: state.auth,
  reportMessage: state.reportMessage,
  shortProfile: state.shortProfile,
  keyFirebase: state.keyFirebase,
  listingReviews: state.listingReviews,
  listingReviewsAll: state.listingReviewsAll,
  getScrollTo: state.getScrollTo,
  listingSidebar: state.listingSidebar,
  myCart: state.cartReducer,
});

const mapDispatchToProps = {
  getListingDetail,
  addMyFavorites,
  getReportForm,
  postReport,
  getKeyFirebase,
  messageChatActive,
  getListingReviewsLoadmore,
  changeListingDetailNavigation,
  getScrollTo,
  getListingReviews,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withNavigationFocus(ListingDetailScreen));
