import { registerRootComponent } from 'expo';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import React, { FC, useEffect, useState } from 'react';
import { Text, View, Button, Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const App: FC = () => {
  const [token, setToken] = useState<string>();
  const [notification, setNotification] = useState<
    Notifications.Notification
  >();

  useEffect(() => {
    registerForPushNotificationsAsync();

    const onResponseReceivedListener = Notifications.addNotificationResponseReceivedListener(
      onResponseReceived
    );
    return () => {
      onResponseReceivedListener.remove();
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (Constants.isDevice) {
      const { status: existingStatus } = await Permissions.getAsync(
        Permissions.NOTIFICATIONS
      );
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Permissions.askAsync(
          Permissions.NOTIFICATIONS
        );
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      const { data: token } = await Notifications.getExpoPushTokenAsync();
      console.log(token);
      setToken(token);
    } else {
      alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  };

  const onResponseReceived = ({
    notification,
  }: Notifications.NotificationResponse) => {
    setNotification(notification);
  };

  // Can use this function below, OR use Expo's Push Notification Tool-> https://expo.io/dashboard/notifications
  const sendPushNotification = async () => {
    const message = {
      to: token,
      sound: 'default',
      title: 'Original Title',
      body: 'And here is the body!',
      data: { data: 'goes here' },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
      }}
    >
      <Text>Your expo push token: {token}</Text>
      {notification?.request && (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text>Title: {notification.request.content.title}</Text>
          <Text>Body: {notification.request.content.body}</Text>
          <Text>Data: {JSON.stringify(notification.request.content.data)}</Text>
        </View>
      )}
      <Button
        title="Press to Send Notification"
        onPress={() => sendPushNotification()}
      />
    </View>
  );
};

registerRootComponent(App);
