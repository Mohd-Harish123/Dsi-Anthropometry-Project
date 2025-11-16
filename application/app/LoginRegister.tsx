
import React, { useEffect, useState } from 'react';
import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { auth } from '../config/firebase'; // keep your existing firebase export

type Props = {
  onLoginSuccess?: (user: User) => void;
};

const db = getFirestore(); // uses default Firebase app initialized in your config

const LoginRegisterScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Role selection for registration; default to 'patient'
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setUserRole(null);
      if (u) {
        // read stored role from Firestore (if exists)
        try {
          const userDocRef = doc(db, 'users', u.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            setUserRole((data as any).role ?? null);
          }
        } catch (err) {
          console.warn('Could not read user role:', err);
        }

        // if (onLoginSuccess) onLoginSuccess(u);
        if (u) {
          try {
            const userDocRef = doc(db, 'users', u.uid);
            const snap = await getDoc(userDocRef);
            const data = snap.exists() ? snap.data() : { role: "Unknown" };

            router.replace({
              pathname: "/home",
              params: {
                name: u.email,
                role: data.role,
              }
            });
          } catch (err) {
            console.warn("Error loading role:", err);
          }
        }

      }
    });
    return () => unsubscribe();
  }, [onLoginSuccess]);

  const validate = (): boolean => {
    if (!email || !password) {
      Alert.alert('Validation', 'Please enter both email and password.');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Validation', 'Password should be at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleRegister = async (): Promise<void> => {
    if (!validate()) return;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // Save role to Firestore under "users/{uid}"
      try {
        const uid = userCredential.user.uid;
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
          email: userCredential.user.email,
          role,
          createdAt: serverTimestamp(),
        });
      } catch (fireErr) {
        console.error('Failed to save user role to Firestore:', fireErr);
        // Don't block registration success UI, but warn dev/user
        Alert.alert('Warning', 'Registered but failed to save role. Try again later.');
      }

      Alert.alert('Success', `Registered as ${userCredential.user.email}`);
      setEmail('');
      setPassword('');
      setIsRegister(false);
    } catch (err: unknown) {
      console.error(err);
      const message = (err as any)?.message?.replace?.('Firebase: ', '') || 'Registration failed';
      Alert.alert('Registration Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (): Promise<void> => {
    if (!validate()) return;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      Alert.alert('Welcome', `Logged in as ${userCredential.user.email}`);
      setEmail('');
      setPassword('');

      // role will be loaded by onAuthStateChanged effect above
    } catch (err: unknown) {
      console.error(err);
      const message = (err as any)?.message?.replace?.('Firebase: ', '') || 'Login failed';
      Alert.alert('Login Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut(auth);
      Alert.alert('Signed out');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not sign out');
    }
  };

  // If user already logged in, show simple profile view + sign out button
  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>You're signed in</Text>
        <Text style={styles.info}>Email: {user.email}</Text>
        <Text style={styles.info}>Role: {userRole ?? 'Unknown'}</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
          <Text style={styles.actionText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.box}>
        <Text style={styles.title}>{isRegister ? 'Create account' : 'Welcome back'}</Text>

        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        {isRegister && (
          <>
            <Text style={{ marginTop: 12, marginBottom: 6 }}>Register as</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'patient' ? styles.roleButtonActive : undefined,
                ]}
                onPress={() => setRole('patient')}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === 'patient' ? styles.roleTextActive : undefined,
                  ]}
                >
                  Patient
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'doctor' ? styles.roleButtonActive : undefined,
                ]}
                onPress={() => setRole('doctor')}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === 'doctor' ? styles.roleTextActive : undefined,
                  ]}
                >
                  Doctor
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 16 }} />
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { marginTop: 12 }]}
            onPress={isRegister ? handleRegister : handleLogin}
          >
            <Text style={styles.actionText}>{isRegister ? 'Register' : 'Login'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => setIsRegister((s) => !s)} style={{ marginTop: 14 }}>
          <Text style={styles.switchText}>
            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>This example uses Firebase Email/Password auth</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginRegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f8',
    padding: 20,
  },
  box: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    padding: 22,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as any,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  info: {
    fontSize: 16,
    marginBottom: 18,
    textAlign: 'center' as const,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#0b6cff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600' as any,
  },
  switchText: {
    textAlign: 'center' as const,
    color: '#444',
    textDecorationLine: 'underline' as const,
  },
  hint: {
    marginTop: 14,
    textAlign: 'center' as const,
    color: '#777',
    fontSize: 12,
  },

  // role selector styles
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#0b6cff',
    borderColor: '#0b6cff',
  },
  roleText: {
    color: '#333',
    fontWeight: '500' as any,
  },
  roleTextActive: {
    color: '#fff',
  },
});
