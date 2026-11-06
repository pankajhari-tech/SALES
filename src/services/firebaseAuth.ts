import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely (singleton with fallback protection)
let app: any = null;
let auth: any = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (err) {
  console.warn('Firebase initialization note:', err);
}

// Scopes required for Google Sheets & Google Drive File creation
export const GOOGLE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

// Configure Google Auth Provider
const provider = new GoogleAuthProvider();
GOOGLE_WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag indicating if a sign-in flow is currently active
let isSigningIn = false;

// In-memory cache for the access token (per security requirements)
let cachedAccessToken: string | null = null;
let cachedUserInfo: { uid: string; displayName: string | null; email: string | null; photoURL: string | null } | null = null;

/**
 * Initialize auth listener on application load
 */
export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else if (cachedUserInfo && cachedAccessToken) {
      // Kept in memory via Google Identity Services
      if (onAuthSuccess) onAuthSuccess(cachedUserInfo, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Fallback: Authenticate using Google Identity Services (GIS) Token Client
 * Useful when Firebase Auth encounters domain authorization or popup restrictions
 */
async function signInWithGoogleIdentityServices(): Promise<{ user: any; accessToken: string }> {
  return new Promise((resolve, reject) => {
    const clientId = firebaseConfig.oAuthClientId;
    if (!clientId) {
      return reject(new Error('Google OAuth Client ID is not configured in firebase-applet-config.json.'));
    }

    const checkGsiReady = () => {
      return typeof (window as any).google !== 'undefined' && (window as any).google.accounts?.oauth2;
    };

    const proceedWithClient = () => {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: GOOGLE_WORKSPACE_SCOPES.join(' '),
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              return reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Google authorization failed.'));
            }

            const token = tokenResponse.access_token;
            if (!token) {
              return reject(new Error('No access token received from Google Identity Services.'));
            }

            cachedAccessToken = token;

            // Fetch user profile from Google UserInfo endpoint
            let userInfo = {
              uid: `gsi-${Date.now()}`,
              displayName: 'Google Account User',
              email: null as string | null,
              photoURL: null as string | null,
            };

            try {
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (profileRes.ok) {
                const profile = await profileRes.json();
                userInfo = {
                  uid: profile.sub || userInfo.uid,
                  displayName: profile.name || profile.given_name || 'Google User',
                  email: profile.email || null,
                  photoURL: profile.picture || null,
                };
              }
            } catch (pErr) {
              console.warn('Profile fetch notice:', pErr);
            }

            cachedUserInfo = userInfo;
            resolve({ user: userInfo, accessToken: token });
          },
        });

        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    };

    if (checkGsiReady()) {
      proceedWithClient();
    } else {
      // Wait up to 3 seconds for GIS script to load
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (checkGsiReady()) {
          clearInterval(interval);
          proceedWithClient();
        } else if (attempts > 30) {
          clearInterval(interval);
          reject(new Error('Google Identity Services client library did not load. Please check your internet connection and retry.'));
        }
      }, 100);
    }
  });
}

/**
 * Trigger Google Sign-In with full Google Sheets & Drive scopes
 * Uses Firebase Auth with automatic fallback to Google Identity Services
 */
export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  try {
    isSigningIn = true;

    // Strategy 1: Attempt Firebase Auth popup if auth is initialized
    if (auth) {
      try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token =
          credential?.accessToken ||
          (result as any)._tokenResponse?.oauthAccessToken ||
          (result as any).user?.accessToken;

        if (token) {
          cachedAccessToken = token;
          cachedUserInfo = {
            uid: result.user.uid,
            displayName: result.user.displayName,
            email: result.user.email,
            photoURL: result.user.photoURL,
          };
          return { user: result.user, accessToken: token };
        }
      } catch (fbErr: any) {
        console.warn('Firebase Popup attempt notice, switching to Google Identity Services:', fbErr);
        // If popup was explicitly closed by the user, don't trigger secondary popup
        if (fbErr.code === 'auth/popup-closed-by-user') {
          throw new Error('Sign-in cancelled. Please select your Google account in the popup.');
        }
      }
    }

    // Strategy 2: Google Identity Services (GIS) Token Client
    const gisResult = await signInWithGoogleIdentityServices();
    return gisResult;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve the current in-memory access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Set an access token manually
 */
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Log out and clear cached credentials
 */
export const logout = async () => {
  try {
    if (auth) {
      await signOut(auth);
    }
  } catch (e) {
    console.warn('Sign-out warning:', e);
  } finally {
    cachedAccessToken = null;
    cachedUserInfo = null;
  }
};

export { auth };
