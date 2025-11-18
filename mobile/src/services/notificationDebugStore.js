// Debug storage removed; provide no-op functions to avoid runtime import errors
export const setLastPushToken = async () => false;
export const getLastPushToken = async () => null;
export const setLastNotification = async () => false;
export const getLastNotification = async () => null;

export default {
  setLastPushToken,
  getLastPushToken,
  setLastNotification,
  getLastNotification,
};
