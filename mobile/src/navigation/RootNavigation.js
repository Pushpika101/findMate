import { createNavigationContainerRef } from '@react-navigation/native';

// A small helper to allow navigation outside react components (e.g. from
// background notification handlers). We keep it minimal: a ref and a
// safe navigate helper that waits shortly if the container isn't ready yet.
export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  try {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name, params);
      return true;
    }

    // If not ready yet, try a short retry. This keeps the helper simple
    // without adding a persistent queue.
    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
      }
    }, 500);
  } catch (e) {
    // swallow errors to avoid crashes from background handlers
    console.warn('NavigationService.navigate error', e);
  }
  return false;
}

export default {
  navigationRef,
  navigate,
};
