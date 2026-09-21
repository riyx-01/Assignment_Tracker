export const setupNotifications = () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return;
  }

  if (Notification.permission === "granted") {
    // Permission already granted
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission();
  }
};

export const triggerNotification = (title, options) => {
  if (Notification.permission === "granted") {
    new Notification(title, options);
  }
};
