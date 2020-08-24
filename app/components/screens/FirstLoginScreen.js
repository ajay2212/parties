import React, { PureComponent } from "react";
import { View, Modal, Dimensions } from "react-native";
import { connect } from "react-redux";
import configureApp from "../../../configureApp.json";
import {
  FormFirstLogin,
  WilWebView,
  LostPasswordModal,
  FBButton,
} from "../dumbs";
import {
  login,
  loginFb,
  getAccountNav,
  getShortProfile,
  getMyProfile,
  setUserConnection,
  getMessageChatNewCount,
  setDeviceTokenToFirebase,
  getNotificationAdminSettings,
  setNotificationSettings,
  loginApple,
  getProductsCart,
} from "../../actions";
import { FontIcon, LoadingFull } from "../../wiloke-elements";
import AppleButton from "../dumbs/AppleButton/AppleButton";
import { majorVersionIOS } from "../smarts/LoginFormContainer";
import { ScrollView } from "react-native-gesture-handler";
import { screenHeight } from "../../constants/styleConstants";

const {
  title: firstLoginTitle,
  text: firstLoginText,
  skipButtonText,
} = configureApp.loginScreenStartApp;

class FirstLoginScreen extends PureComponent {
  state = {
    isLoginLoading: false,
    isLoadingFbLogin: false,
    fbLoginErrorMessage: "",
    modalVisible: false,
    loadingApple: false,
  };

  _handleLoginDefault = async (results) => {
    const { login } = this.props;
    this.setState({
      isLoginLoading: true,
    });
    await login(results);
    this._getInfo();
  };

  _handleLoginFb = async (data, token) => {
    const { loginFb } = this.props;
    await this.setState({ isLoadingFbLogin: true });
    await loginFb(data.id, token);
    this._getInfo();
  };

  _handleLoginFbError = (errorType) => {
    const { translations } = this.props;
    this.setState({
      fbLoginErrorMessage: translations[errorType],
    });
  };

  _handleLoginApple = async (credential) => {
    const { loginApple } = this.props;
    const { authorizationCode, email, identityToken } = credential;
    await this.setState({
      isLoadingFbLogin: true,
    });
    await loginApple(authorizationCode, identityToken, email);
    const { auth } = this.props;
    if (!auth.token) {
      Alert.alert(auth.message);
      this.setState({
        isLoadingFbLogin: false,
      });
      return;
    }
    this._getInfo();
  };

  _getInfo = async () => {
    const {
      getAccountNav,
      getMyProfile,
      getShortProfile,
      setUserConnection,
      getMessageChatNewCount,
      deviceToken,
      setDeviceTokenToFirebase,
      navigation,
      getProductsCart,
    } = this.props;
    getAccountNav();
    getMyProfile();
    await getShortProfile();
    const { shortProfile, auth } = this.props;
    const myID = shortProfile.userID;
    const { firebaseID } = shortProfile;
    if (auth.isLoggedIn && myID) {
      setUserConnection(myID, true);
      getMessageChatNewCount(myID);
      setDeviceTokenToFirebase(myID, firebaseID, deviceToken);
      getProductsCart(auth.token);
      await this._handleNotificationSettings(myID);
      navigation.navigate("HomeScreen");
    }
    this.setState({
      isLoginLoading: false,
      isLoadingFbLogin: false,
    });
    Keyboard.dismiss();
  };

  _handleNotificationSettings = async (myID) => {
    await this.props.getNotificationAdminSettings();
    const { notificationAdminSettings } = this.props;
    await this.props.setNotificationSettings(
      myID,
      notificationAdminSettings,
      "start"
    );
  };

  _handleSkip = () => {
    const { navigation } = this.props;
    navigation.navigate("HomeScreen");
  };

  _handleNavigateRegister = () => {
    const { navigation } = this.props;
    navigation.navigate("AccountScreen", {
      activeType: "register",
    });
  };

  _handleNavigateLostPassword = () => {
    const url = "https://wilcity.com/login/?action=rp";
    this.setState({
      modalVisible: true,
    });
  };

  _handleGoBack = () => {
    this.setState({
      modalVisible: false,
    });
  };

  _renderBottom = () => {
    const { settings } = this.props;
    const { isLoadingFbLogin, loadingApple } = this.state;
    const { oFacebook } = settings;
    return (
      <View style={{ width: "100%" }}>
        {!!oFacebook && oFacebook.isEnableFacebookLogin && (
          <FBButton
            radius="round"
            isLoading={isLoadingFbLogin}
            appID={oFacebook.appID}
            onAction={this._handleLoginFb}
            onError={this._handleLoginFbError}
          />
        )}
        {Platform.OS === "ios" && majorVersionIOS > 12 && (
          <View style={{ marginTop: 10 }}>
            <AppleButton
              onAction={this._handleLoginApple}
              isLoading={false}
              buttonStyle={configureApp.appleColor}
            />
          </View>
        )}
      </View>
    );
  };

  render() {
    const { translations, settings, loginError } = this.props;
    const { isLoginLoading, fbLoginErrorMessage, modalVisible } = this.state;
    return (
      <ScrollView
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        contentContainerStyle={{
          flex: 1,
        }}
      >
        <View style={{ flex: 1, minHeight: Dimensions.get("screen").height }}>
          <FormFirstLogin
            title={firstLoginTitle}
            text={firstLoginText}
            skipButtonText={skipButtonText}
            colorPrimary={settings.colorPrimary}
            translations={translations}
            onSkip={this._handleSkip}
            onNavigateRegister={this._handleNavigateRegister}
            onNavigateLostPassword={this._handleNavigateLostPassword}
            isLoginLoading={isLoginLoading}
            onLogin={this._handleLoginDefault}
            loginError={loginError ? translations[loginError] : ""}
            loginFbError={fbLoginErrorMessage}
            renderBottom={this._renderBottom}
          />
          <LostPasswordModal
            visible={modalVisible}
            onRequestClose={this._handleGoBack}
            source={{ uri: settings.resetPasswordURL }}
          />
          <LoadingFull visible={this.state.isLoadingFbLogin} />
        </View>
      </ScrollView>
    );
  }
}

const mapStateToProps = ({
  translations,
  deviceToken,
  shortProfile,
  auth,
  settings,
  notificationAdminSettings,
  loginError,
}) => ({
  translations,
  deviceToken,
  shortProfile,
  auth,
  settings,
  notificationAdminSettings,
  loginError,
});

const mapDispatchToProps = {
  login,
  loginFb,
  getAccountNav,
  getShortProfile,
  getMyProfile,
  setUserConnection,
  getMessageChatNewCount,
  setDeviceTokenToFirebase,
  getNotificationAdminSettings,
  setNotificationSettings,
  loginApple,
  getProductsCart,
};

export default connect(mapStateToProps, mapDispatchToProps)(FirstLoginScreen);
