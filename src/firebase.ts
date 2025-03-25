// IndexedDB-based data management system
// This enhances the previous localStorage approach with more persistent storage

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

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  console.log('Initializing IndexedDB...');
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TuneboxedDB', 1);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('Error opening IndexedDB');
    };
    
    request.onsuccess = (event) => {
      console.log('IndexedDB opened successfully');
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      console.log('IndexedDB upgrade needed, creating object stores...');
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('users')) {
        console.log('Creating users object store');
        db.createObjectStore('users', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pageViews')) {
        console.log('Creating pageViews object store');
        db.createObjectStore('pageViews', { keyPath: 'timestamp' });
      }
    };
  });
};

// Simple analytics tracking
export const trackPageView = async (pagePath: string) => {
  try {
    const pageView: PageView = {
      path: pagePath,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent
    };
    
    // Store in IndexedDB
    const db = await initDB();
    const transaction = db.transaction(['pageViews'], 'readwrite');
    const store = transaction.objectStore('pageViews');
    store.add(pageView);
    
    // Also store in localStorage for backward compatibility
    const pageViews = JSON.parse(localStorage.getItem('tuneboxed_pageviews') || '[]');
    pageViews.push(pageView);
    localStorage.setItem('tuneboxed_pageviews', JSON.stringify(pageViews));
    
    console.log('Page view tracked:', pagePath);
  } catch (error) {
    console.error('Error tracking page view:', error);
    
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
  
  // Create a unique ID
  const userId = 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  
  // Create user object
  const user: User = {
    id: userId,
    email,
    name,
    createdAt: new Date().toISOString()
  };
  console.log('Created user object:', user);
  
  try {
    // First, save to localStorage for guaranteed storage
    const localUsers = JSON.parse(localStorage.getItem('tuneboxed_users') || '[]');
    
    // Check if email already exists
    if (localUsers.some((u: User) => u.email === email)) {
      console.log('Email already exists in localStorage, throwing error');
      throw new Error('Email already in use');
    }
    
    // Add to localStorage
    localUsers.push(user);
    localStorage.setItem('tuneboxed_users', JSON.stringify(localUsers));
    localStorage.setItem('tuneboxed_current_user', JSON.stringify(user));
    console.log('User added to localStorage');
    
    // Then try to store in IndexedDB
    try {
      console.log('Opening IndexedDB to store user...');
      const db = await initDB();
      
      return new Promise<{user: User}>((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        
        console.log('Adding user to IndexedDB...');
        const request = store.add(user);
        
        request.onsuccess = () => {
          console.log('User added to IndexedDB successfully');
          resolve({ user });
        };
        
        request.onerror = (event) => {
          console.error('Error adding user to IndexedDB:', event);
          // Still resolve because we saved to localStorage
          resolve({ user });
        };
        
        transaction.oncomplete = () => {
          console.log('Transaction completed successfully');
        };
        
        transaction.onerror = (event) => {
          console.error('Transaction error:', event);
          // Still resolve because we saved to localStorage
          resolve({ user });
        };
      });
    } catch (error) {
      console.error('IndexedDB error:', error);
      // Still return success because we saved to localStorage
      return { user };
    }
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

// Sign in with email (simplified - no real auth)
export const signInWithEmail = async (email: string, password: string) => {
  try {
    // Get users from IndexedDB
    const users = await getAllUsers();
    
    // Find user by email
    const user = users.find((u: User) => u.email === email);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // In a real app, we would check the password here
    // For demo purposes, we'll just log the user in
    localStorage.setItem('tuneboxed_current_user', JSON.stringify(user));
    
    console.log('User signed in:', user);
    return { user };
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
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
export const signOut = () => {
  localStorage.removeItem('tuneboxed_current_user');
  console.log('User signed out');
};

// Get all users (admin function)
export const getAllUsers = async (): Promise<User[]> => {
  console.log('getAllUsers called');
  try {
    console.log('Opening IndexedDB to get users...');
    const db = await initDB();
    
    // First try to get users from localStorage for backward compatibility
    const localStorageUsers = JSON.parse(localStorage.getItem('tuneboxed_users') || '[]');
    console.log('Users from localStorage:', localStorageUsers);
    
    console.log('Getting users from IndexedDB...');
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        console.log('IndexedDB users retrieved successfully:', request.result);
        // Merge IndexedDB and localStorage users to ensure we have all data
        const indexedDBUsers = request.result || [];
        
        // Merge users by email to avoid duplicates
        const emailMap = new Map();
        [...indexedDBUsers, ...localStorageUsers].forEach(user => {
          if (user.email) {
            emailMap.set(user.email, user);
          } else {
            // For users without email, use their ID
            emailMap.set(user.id, user);
          }
        });
        
        const mergedUsers = Array.from(emailMap.values());
        console.log('Merged users:', mergedUsers);
        
        // Store merged users back to both storage mechanisms
        localStorage.setItem('tuneboxed_users', JSON.stringify(mergedUsers));
        
        resolve(mergedUsers);
      };
      
      request.onerror = (event) => {
        console.error('Error getting users from IndexedDB:', event);
        // Fallback to localStorage
        console.log('Falling back to localStorage users only');
        resolve(localStorageUsers);
      };
    });
  } catch (error) {
    console.error('Error getting users:', error);
    // Fallback to localStorage
    const users = JSON.parse(localStorage.getItem('tuneboxed_users') || '[]');
    console.log('Fallback to localStorage only, users:', users);
    return users;
  }
};

// Get page view analytics (admin function)
export const getPageViews = async (): Promise<PageView[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(['pageViews'], 'readonly');
    const store = transaction.objectStore('pageViews');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        console.error('Error getting page views from IndexedDB:', event);
        // Fallback to localStorage
        try {
          const views = JSON.parse(localStorage.getItem('tuneboxed_pageviews') || '[]');
          resolve(views);
        } catch (error) {
          console.error('LocalStorage fallback error:', error);
          resolve([]);
        }
      };
    });
  } catch (error) {
    console.error('Error getting page views:', error);
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem('tuneboxed_pageviews') || '[]');
  }
};

// Export simplified auth object for compatibility
export const auth = {
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    // Check local storage for current user
    const user = getCurrentUser();
    callback(user);
    return () => {}; // Return dummy unsubscribe function
  },
  currentUser: getCurrentUser()
};

// Export simple object for compatibility
export const db = {
  collection: (collectionName: string) => ({
    // No-op function for compatibility
    addDoc: async (data: any) => {
      console.log(`Would add to ${collectionName}:`, data);
      return { id: 'local-id' };
    },
    // Get documents from local storage
    getDocs: async () => {
      if (collectionName === 'users') {
        const users = await getAllUsers();
        return { docs: users.map((u: User) => ({ id: u.id, data: () => u })) };
      }
      return { docs: [] };
    }
  })
};

// Analytics mock
export const analytics = {
  logEvent: (eventName: string, params: any) => {
    console.log('Analytics event:', eventName, params);
  }
}; 