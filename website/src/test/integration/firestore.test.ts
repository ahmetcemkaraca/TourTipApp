import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupEmulator, cleanupEmulator } from '../emulator-setup';
import { getFirestore, collection, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

describe('Firestore Integration Tests', () => {
  beforeAll(async () => {
    await setupEmulator();
  });

  afterAll(async () => {
    await cleanupEmulator();
  });

  it('should create and read a document', async () => {
    const db = getFirestore();
    const testDoc = doc(db, 'test-collection', 'test-doc');
    
    await setDoc(testDoc, {
      title: 'Test Document',
      content: 'This is a test document',
      createdAt: new Date().toISOString()
    });

    const docSnap = await getDoc(testDoc);
    expect(docSnap.exists()).toBe(true);
    expect(docSnap.data()?.title).toBe('Test Document');
  });

  it('should delete a document', async () => {
    const db = getFirestore();
    const testDoc = doc(db, 'test-collection', 'test-doc-to-delete');
    
    // Create document first
    await setDoc(testDoc, { title: 'To be deleted' });
    
    // Verify it exists
    const docSnap = await getDoc(testDoc);
    expect(docSnap.exists()).toBe(true);
    
    // Delete document
    await deleteDoc(testDoc);
    
    // Verify it's deleted
    const deletedDocSnap = await getDoc(testDoc);
    expect(deletedDocSnap.exists()).toBe(false);
  });

  it('should handle user collection operations', async () => {
    const db = getFirestore();
    const userDoc = doc(db, 'users', 'test-user-1');
    
    const userData = {
      uid: 'test-user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
      createdAt: new Date().toISOString()
    };

    await setDoc(userDoc, userData);
    
    const userSnap = await getDoc(userDoc);
    expect(userSnap.exists()).toBe(true);
    expect(userSnap.data()?.email).toBe('test@example.com');
    expect(userSnap.data()?.role).toBe('user');
  });

  it('should handle tour collection operations', async () => {
    const db = getFirestore();
    const tourDoc = doc(db, 'tours', 'test-tour-1');
    
    const tourData = {
      id: 'test-tour-1',
      title: 'Test Tour',
      description: 'A test tour for development',
      price: 100,
      currency: 'TRY',
      duration: 4,
      maxParticipants: 20,
      category: 'cultural',
      isActive: true,
      createdAt: new Date().toISOString()
    };

    await setDoc(tourDoc, tourData);
    
    const tourSnap = await getDoc(tourDoc);
    expect(tourSnap.exists()).toBe(true);
    expect(tourSnap.data()?.title).toBe('Test Tour');
    expect(tourSnap.data()?.price).toBe(100);
    expect(tourSnap.data()?.isActive).toBe(true);
  });
});
