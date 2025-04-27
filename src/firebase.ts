// Firebase integration with proper imports
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/analytics';

// Simple localStorage-based data management system
// We'll add actual Firebase integration once we have deployment working

// User data type
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// Page view type
interface PageView {
  path: string;
  timestamp: string;
  referrer: string;
  userAgent: string;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtNUu5-ylv8EyVtA14TgD84TVUpVgkVCg",
  authDomain: "tuneboxed.firebaseapp.com",
  projectId: "tuneboxed",
  storageBucket: "tuneboxed.firebasestorage.app",
  messagingSenderId: "80836837100",
  appId: "1:80836837100:web:9b61c5723eae9c6945efc9",
  measurementId: "G-FXG1R8PZT2"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const analytics = firebase.analytics();

// Simple analytics tracking
export const trackPageView = async (pagePath: string) => {
  try {
    const pageView: PageView = {
      path: pagePath,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent
    };
    
    // Store in Firestore
    await db.collection('pageViews').add(pageView);
    console.log('Page view tracked in Firestore:', pagePath);
    
    // Also track in analytics
    analytics.logEvent('page_view', pageView);
    
    // For backward compatibility, also store in localStorage
    try {
      const pageViews = JSON.parse(localStorage.getItem('tuneboxed_pageviews') || '[]');
      pageViews.push(pageView);
      localStorage.setItem('tuneboxed_pageviews', JSON.stringify(pageViews));
    } catch (error) {
      console.error('LocalStorage error:', error);
    }
  } catch (error) {
    console.error('Error tracking page view in Firestore:', error);
    
    // Fallback to localStorage only
    try {
      const pageViews = JSON.parse(localStorage.getItem('tuneboxed_pageviews') || '[]');
      pageViews.push({
        path: pagePath,
        timestamp: new Date().toISOString(),
        referrer: document.referrer || 'direct',
        userAgent: navigator.userAgent
      });
      localStorage.setItem('tuneboxed_pageviews', JSON.stringify(pageViews));
    } catch (fallbackError) {
      console.error('LocalStorage fallback error:', fallbackError);
    }
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, name: string) => {
  console.log(`SignUpWithEmail called for ${email} with name ${name}`);
  
  try {
    // Create user in Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const userId = userCredential.user?.uid;
    
    if (!userId) {
      throw new Error('Failed to create user, no user ID returned');
    }
    
    // Create user object
    const user: User = {
      id: userId,
      email,
      name,
      createdAt: new Date().toISOString()
    };
    
    // Store user data in Firestore
    await db.collection('users').doc(userId).set(user);
    console.log('User added to Firestore:', user);
    
    // For backward compatibility, also store in localStorage
    try {
      const localUsers = JSON.parse(localStorage.getItem('tuneboxed_users') || '[]');
      localUsers.push(user);
      localStorage.setItem('tuneboxed_users', JSON.stringify(localUsers));
      localStorage.setItem('tuneboxed_current_user', JSON.stringify(user));
    } catch (error) {
      console.error('LocalStorage error:', error);
    }
    
    return { user };
  } catch (error: any) {
    console.error('Error during sign up:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email already in use');
    }
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    // Sign in using Firebase Auth
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const userId = userCredential.user?.uid;
    
    if (!userId) {
      throw new Error('Failed to sign in, no user ID returned');
    }
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Create a basic user record if it doesn't exist in Firestore
      const user: User = {
        id: userId,
        email,
        name: email.split('@')[0], // Basic name from email
        createdAt: new Date().toISOString()
      };
      
      await db.collection('users').doc(userId).set(user);
      
      // Also update localStorage for backward compatibility
      localStorage.setItem('tuneboxed_current_user', JSON.stringify(user));
      
      return { user };
    }
    
    const user = userDoc.data() as User;
    
    // Update localStorage for backward compatibility
    localStorage.setItem('tuneboxed_current_user', JSON.stringify(user));
    
    console.log('User signed in:', user);
    return { user };
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

// Get current user - uses Auth state with Firestore data
export const getCurrentUser = () => {
  // First check Firebase auth state
  const firebaseUser = auth.currentUser;
  
  if (firebaseUser) {
    // Return user from localStorage while we fetch from Firestore
    const localUser = localStorage.getItem('tuneboxed_current_user');
    if (localUser) {
      return JSON.parse(localUser);
    }
    
    // Return basic user info from auth
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      createdAt: new Date().toISOString()
    };
  }
  
  // Fallback to localStorage for backward compatibility
  try {
    const userString = localStorage.getItem('tuneboxed_current_user');
    if (!userString) return null;
    return JSON.parse(userString);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Sign out
export const signOut = async () => {
  try {
    await auth.signOut();
    localStorage.removeItem('tuneboxed_current_user');
    console.log('User signed out');
  } catch (error) {
    console.error('Error signing out:', error);
    // Still remove from localStorage
    localStorage.removeItem('tuneboxed_current_user');
  }
};

// Get all users (admin function)
export const getAllUsers = async (): Promise<User[]> => {
  console.log('getAllUsers called');
  try {
    // Get users from Firestore
    const querySnapshot = await db.collection('users').get();
    const users = querySnapshot.docs.map(doc => doc.data() as User);
    console.log('Users from Firestore:', users);
    
    // Update localStorage for backward compatibility
    localStorage.setItem('tuneboxed_users', JSON.stringify(users));
    
    return users;
  } catch (error) {
    console.error('Error getting users from Firestore:', error);
    
    // Fallback to localStorage
    const users = JSON.parse(localStorage.getItem('tuneboxed_users') || '[]');
    console.log('Fallback to localStorage only, users:', users);
    return users;
  }
};

// Get page view analytics (admin function)
export const getPageViews = async (): Promise<PageView[]> => {
  try {
    // Get page views from Firestore
    const querySnapshot = await db.collection('pageViews').get();
    const pageViews = querySnapshot.docs.map(doc => doc.data() as PageView);
    
    return pageViews;
  } catch (error) {
    console.error('Error getting page views from Firestore:', error);
    
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem('tuneboxed_pageviews') || '[]');
  }
};

// Add listener for auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Get user data from Firestore
        const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
        if (userDoc.exists) {
          callback(userDoc.data() as User);
        } else {
          // Basic user info if not in Firestore
          callback({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            createdAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        // Fallback to basic user info
        callback({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          createdAt: new Date().toISOString()
        });
      }
    } else {
      callback(null);
    }
  });
};

// Export Firebase objects for direct access if needed
export { firebase, auth, db, analytics }; 