import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-storage.js";

//Add API KEY here
const firebaseConfig = {
    apiKey: "AIzaSyAldJA8J3Ry6PBeK6C34asRgfb68DH5OLA",
    authDomain: "zatambackend.firebaseapp.com",
    projectId: "zatambackend",
    storageBucket: "zatambackend.firebasestorage.app",
    messagingSenderId: "25387705837",
    appId: "1:25387705837:web:a2657d3d0881aeff2173e4",
    measurementId: "G-8KGC8SMN8R"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Firebase Storage

// Create User Document in "users" collection
const createUserDocument = async (user) => {
    const userRef = doc(db, "users", user.uid);

    // Check if the user document already exists
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        // Create a new user document
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "Anonymous",
            createdAt: new Date(),
        });
    }
};

// Function to handle Google Sign-In
const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if the user already exists in Firestore
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            // If the user doesn't exist, create a new document in Firestore
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName, // Use the displayName from Google
                createdAt: new Date(), // Track when the user was created
            });
            console.log("New user added to Firestore with Google displayName");
        } else {
            console.log("User already exists in Firestore");
        }
    } catch (error) {
        console.error("Error signing in with Google:", error);
    }
};

const updateUserScore = async (userId, gameId, newScore) => {
    try {
        if (!auth.currentUser) {
            console.error("User not logged in!");
            alert("User not logged in! Please log in first.");
            return;
        }

        // Ensure user is only updating their own scores
        if (auth.currentUser.uid !== userId) {
            console.error("Mismatched user ID. Cannot update score.");
            alert("Unauthorized: You can only update your own scores.");
            return;
        }

        console.log(`Updating score for User: ${userId}, Game: ${gameId}, New Score: ${newScore}`);

        // Correct Firestore reference
        const scoreRef = doc(db, "users", userId, "scores", gameId);
        const scoreDoc = await getDoc(scoreRef);

        if (scoreDoc.exists()) {
            const existingScore = scoreDoc.data().highestScore || 0;
            console.log("Existing Score: ", existingScore);

            if (newScore > existingScore) {
                await setDoc(scoreRef, {
                    highestScore: newScore,
                    lastPlayed: new Date(),
                }, { merge: true });

                console.log("New high score updated!");
            } else {
                console.log("Score is not higher. No update needed.");
            }
        } else {
            await setDoc(scoreRef, {
                highestScore: newScore,
                lastPlayed: new Date(),
            });

            console.log("First-time score added!");
        }
    } catch (error) {
        console.error("Error updating user score:", error);
        //alert("Error updating score! Please try again.");
    }
};

// Get Scoreboard
const getScoreboard = async (gameId) => {
    const scoresRef = collection(db, "scores");
    const q = query(
        scoresRef,
        where("gameId", "==", gameId),
        orderBy("highestScore", "desc"),
        limit(10) // Fetch top 10 scores
    );

    const scoreboard = [];
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        scoreboard.push(doc.data());
    });

    return scoreboard;
};

// Upload Profile Photo to Firebase Storage
const uploadProfilePhoto = async (file, userId) => {
    const storageRef = ref(storage, `profilePhotos/${userId}`);
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);
    return photoURL;
};

// Export all necessary functions and objects
export {
    app,
    analytics,
    auth,
    signInWithEmailAndPassword,
    googleProvider,
    signInWithPopup,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signOut,
    db,
    collection,
    doc,
    getDoc,
    setDoc,
    storage,
    ref,
    uploadBytes,
    getDownloadURL,
    createUserDocument,
    updateUserScore,
    getScoreboard,
    uploadProfilePhoto,
    signInWithGoogle
};