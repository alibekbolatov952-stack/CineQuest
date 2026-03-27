import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  favorites: string[]; // Array of movie IDs
  loading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePoints: (points: number) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  spendTokens: (amount: number) => Promise<boolean>;
  toggleFavorite: (movieId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeFavorites: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      if (unsubscribeFavorites) {
        unsubscribeFavorites();
        unsubscribeFavorites = null;
      }

      if (user) {
        // ... existing user doc logic ...
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'User',
              photoURL: user.photoURL || '',
              role: user.email === 'alibekbolatov952@gmail.com' ? 'admin' : 'user',
              points: 0,
              tokens: 0,
              level: 1,
              achievements: [],
              createdAt: serverTimestamp(),
              settings: {
                emailNotifications: true,
                publicProfile: true,
                language: 'ru'
              }
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          } else {
            const data = userDoc.data() as UserProfile;
            if (user.email === 'alibekbolatov952@gmail.com' && data.role !== 'admin') {
              await setDoc(userDocRef, { role: 'admin' }, { merge: true });
              data.role = 'admin';
            }
            setProfile(data);
          }
          
          unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
              setProfile(snapshot.data() as UserProfile);
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          });

          // Listen for favorites
          const favQuery = query(collection(db, 'favorites'), where('userId', '==', user.uid));
          unsubscribeFavorites = onSnapshot(favQuery, (snapshot) => {
            const favIds = snapshot.docs.map(doc => doc.data().movieId as string);
            setFavorites(favIds);
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'favorites');
          });

        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setProfile(null);
        setFavorites([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeFavorites) unsubscribeFavorites();
    };
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Вы успешно вошли!');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/popup-blocked') {
        toast.error('Пожалуйста, разрешите всплывающие окна для входа');
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error('Этот домен не разрешен в настройках Firebase');
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error('Вход через Google не включен в консоли Firebase');
      } else {
        toast.error(`Ошибка входа: ${error.message}`);
      }
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Вы успешно вошли!');
    } catch (error: any) {
      console.error('Email login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('Неверный E-mail или пароль');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Некорректный E-mail');
      } else {
        toast.error(`Ошибка входа: ${error.message}`);
      }
    }
  };

  const registerWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success('Аккаунт успешно создан!');
    } catch (error: any) {
      console.error('Email registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Этот E-mail уже используется');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Пароль слишком слабый (минимум 6 символов)');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Некорректный E-mail');
      } else {
        toast.error(`Ошибка регистрации: ${error.message}`);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updatePoints = async (points: number) => {
    if (!user || !profile) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const newPoints = profile.points + points;
      const newLevel = Math.floor(newPoints / 100) + 1;
      await setDoc(userDocRef, { 
        points: newPoints,
        level: newLevel,
        tokens: profile.tokens + (points > 0 ? Math.floor(points / 2) : 0)
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const spendTokens = async (amount: number): Promise<boolean> => {
    if (!user || !profile) return false;
    if (profile.tokens < amount) {
      toast.error('Недостаточно жетонов!');
      return false;
    }

    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, { 
        tokens: profile.tokens - amount
      }, { merge: true });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      return false;
    }
  };

  const toggleFavorite = async (movieId: string) => {
    if (!user) {
      toast.error('Войдите, чтобы добавить в избранное');
      return;
    }
    try {
      const favQuery = query(collection(db, 'favorites'), where('userId', '==', user.uid), where('movieId', '==', movieId));
      const favSnap = await getDocs(favQuery);
      
      if (!favSnap.empty) {
        await deleteDoc(doc(db, 'favorites', favSnap.docs[0].id));
        toast.success('Удалено из избранного');
      } else {
        await addDoc(collection(db, 'favorites'), {
          userId: user.uid,
          movieId: movieId,
          addedAt: serverTimestamp()
        });
        updatePoints(3);
        toast.success('Добавлено в избранное');
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      toast.error('Ошибка при обновлении избранного');
      handleFirestoreError(error, OperationType.WRITE, 'favorites');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      favorites, 
      loading, 
      isAuthModalOpen, 
      setIsAuthModalOpen, 
      login, 
      loginWithEmail,
      registerWithEmail,
      logout, 
      updatePoints, 
      updateProfile, 
      spendTokens, 
      toggleFavorite 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
