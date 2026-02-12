// loadFacebookSdk.js
// Loads the Facebook SDK once, shared across Messenger & future Instagram integration.
// Returns a promise that resolves to window.FB.

let fbSdkPromise = null;

export function loadFacebookSdk() {
  if (fbSdkPromise) return fbSdkPromise;

  fbSdkPromise = new Promise((resolve, reject) => {
    if (window.FB) {
      resolve(window.FB);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: import.meta.env.VITE_FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v21.0'
      });
      resolve(window.FB);
    };

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      fbSdkPromise = null;
      reject(new Error('Failed to load Facebook SDK'));
    };
    document.body.appendChild(script);
  });

  return fbSdkPromise;
}

export default loadFacebookSdk;
