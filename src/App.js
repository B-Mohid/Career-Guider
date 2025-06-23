import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, deleteDoc } from 'firebase/firestore';

// Lucide React icons for a visually engaging UI
import {
  Lightbulb, GraduationCap, Briefcase, Sparkles, User, BookOpen, Send, Loader2,
  ArrowLeft, School, DollarSign, TrendingUp, ChevronRight, BookText,
  LogOut, ClipboardList, ListChecks, Target, Tag, TrendingUpIcon,
  Home, Book, Award, FileText, Settings, Layers, SquareUserRound, Menu, X, Save, XCircle, Phone // Added Phone for mobile number
} from 'lucide-react';

// --- Firebase Configuration ---
// IMPORTANT: For Vercel deployment, these values will come from environment variables.
// For local testing, ensure they are correct or fallback to dummy values.
// Replace "YOUR_FIREBASE_API_KEY_HERE" with your actual Firebase Web App API Key
// You can find this in your Firebase Project settings -> General -> Your apps -> Web app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCU8smOeZMg9x-nd0_wtTHoGmyCVgi2ACU", // <-- VERIFY THIS IS YOUR ACTUAL FIREBASE API KEY
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-journey-begins.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-journey-begins",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-journey-begins.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "908988814944",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:988149089844:web:c480804a55aba8444f6c61",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-3TKSNC0XTK"
};

// IMPORTANT: Your Gemini API Key. For Vercel, this will also come from an environment variable.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBDF6AdfqBVMbwZxYj4QPJHlg0FfvhuHe4"; // Your provided Gemini API Key

// Initialize Firebase App and services once globally
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Pre-defined static career data (remains the same)
const staticCareerData = {
  "Science (MPC)": {
    title: "Science (Maths, Physics, Chemistry)",
    description: "Ideal for those who love logic, problem-solving, and understanding how things work. It's the primary gateway to engineering, technology, and pure sciences.",
    emoji: "🔬",
    careers: [
      { name: "Software Engineer", description: "Designs, develops, and maintains software applications." },
      { name: "Data Scientist", description: "Analyze complex data to extract meaningful insights." },
      { name: "Civil Engineer", description: "Design, build, and maintain infrastructure projects." }
    ]
  },
  "Science (BiPC)": {
    title: "Science (Biology, Physics, Chemistry)",
    description: "The path for aspiring doctors, researchers, and healthcare professionals. It focuses on life sciences and their application in medicine and biotechnology.",
    emoji: "🧬",
    careers: [
      { name: "Doctor (MBBS)", description: "Diagnose and treat illnesses, dedicated to saving lives." },
      { name: "Pharmacist", description: "Dispense medications and provide expertise in safe drug use." },
      { name: "Biotechnologist", description: "Research and develop new products using biological systems." }
    ]
  },
  "Commerce": {
    title: "Commerce",
    description: "For future entrepreneurs, financial experts, and business leaders. This stream deals with trade, business, financial transactions, and economics.",
    emoji: "💼",
    careers: [
      { name: "Chartered Accountant (CA)", description: "Manage finances, audit accounts, and offer financial advice." },
      { name: "Investment Banker", description: "Help companies raise capital and provide financial advisory." },
      { name: "Marketing Manager", description: "Develop strategies to promote products or services." }
    ]
  },
  "Arts / Humanities": {
    title: "Arts / Humanities",
    description: "Offers a diverse range of subjects like History, Political Science, and Literature. It is perfect for creative minds and those interested in civil services, law, and social sciences.",
    emoji: "🎨",
    careers: [
      { name: "Civil Servant (IAS/IPS)", description: "Serve the public through various government roles, impacting policy and administration." },
      { name: "Journalist", description: "Investigate, write, and report news and current events across various media platforms." },
      { name: "Graphic Designer", description: "Creates visual concepts to communicate ideas." }
    ]
  },
  "CreativeArtsDesign": {
    title: "Creative Arts & Design",
    description: "For individuals with artistic flair, imagination, and a passion for creating. This stream includes visual arts, performing arts, and various design fields.",
    emoji: "🎭",
    careers: [
      { name: "Artist", description: "Creates visual art (painting, sculpture, digital art) for expression or commercial purposes." },
      { name: "Musician", description: "Composes, performs, or produces music." },
      { name: "Animator/Filmmaker", description: "Creates animated sequences, films, or visual effects." }
    ]
  },
  "SportsFitness": {
    title: "Sports & Fitness",
    description: "For those passionate about physical activity, health, and athletic performance. This path includes professional sports, coaching, and sports management.",
    emoji: "🏅",
    careers: [
      { name: "Professional Athlete/Coach", description: "Participates in sports professionally or trains athletes." },
      { name: "Sports Manager/Marketer", description: "Handles the business aspects of sports." }
    ]
  },
  "EntrepreneurshipInnovation": {
    title: "Entrepreneurship & Innovation",
    description: "For visionary individuals who want to create their own ventures, innovate, and bring new ideas to life.",
    emoji: "💡",
    careers: [
      { name: "Startup Founder", description: "Launches and grows a new business venture." },
      { name: "Social Entrepreneur", description: "Combines business principles with a mission to address social problems." }
    ]
  },
  "CulinaryArts": {
    title: "Culinary Arts",
    description: "For those with a passion for food, cooking, and creating unique gastronomic experiences.",
    emoji: "🔪",
    careers: [
      { name: "Chef", description: "Prepares food, manages kitchens, and creates menus in various culinary settings." },
      { name: "Food Scientist", description: "Researches and develops new food products and processes." }
    ]
  }
};

// Assessment questions (remains the same)
const assessmentQuestions = [
  {
    question: "Which activity sounds most interesting to you?",
    options: [
      { text: "Building a robot or coding a game", stream: "Science (MPC)" },
      { text: "Researching how to cure a disease", stream: "Science (BiPC)" },
      { text: "Creating a business plan for a startup", stream: "Commerce" },
      { text: "Writing a story or directing a film", stream: "Arts / Humanities" },
      { text: "Designing a new product or fashion line", stream: "CreativeArtsDesign" },
      { text: "Organizing a sports event or fitness challenge", stream: "SportsFitness" },
      { text: "Launching a new business or social initiative", stream: "EntrepreneurshipInnovation" },
      { text: "Experimenting with recipes and cooking new dishes", stream: "CulinaryArts" },
      { text: "Playing a musical instrument or composing songs", stream: "CreativeArtsDesign" },
      { text: "Painting, sculpting, or drawing detailed artwork", stream: "CreativeArtsDesign" }
    ]
  },
  {
    question: "When faced with a problem, you are more likely to:",
    options: [
      { text: "Use logic and data to find the optimal solution", stream: "Science (MPC)" },
      { text: "Understand the biological or chemical aspects", stream: "Science (BiPC)" },
      { text: "Analyze the financial costs and benefits", stream: "Commerce" },
      { text: "Consider the human and social impact", stream: "Arts / Humanities" },
      { text: "Brainstorm creative visual solutions", stream: "CreativeArtsDesign" },
      { text: "Seek a practical, hands-on physical solution", stream: "SportsFitness" },
      { text: "Identify new opportunities and devise a strategy", stream: "EntrepreneurshipInnovation" },
      { text: "Innovate new culinary techniques or flavors", stream: "CulinaryArts" },
      { text: "Express emotions and tell stories through sound", stream: "CreativeArtsDesign" },
      { text: "Visualize and create aesthetic compositions", stream: "CreativeArtsDesign" }
    ]
  },
  {
    question: "Which subjects/areas do you naturally excel at or enjoy most?",
    options: [
      { text: "Math & Physics", stream: "Science (MPC)" },
      { text: "Biology & Chemistry", stream: "Science (BiPC)" },
      { text: "Economics & Business Studies", stream: "Commerce" },
      { text: "History & Literature", stream: "Arts / Humanities" },
      { text: "Art, Design, or Music", stream: "CreativeArtsDesign" },
      { text: "Physical Education & Sports Science", stream: "SportsFitness" },
      { text: "Commerce, Business, or any practical skill development", stream: "EntrepreneurshipInnovation" },
      { text: "Culinary Arts & Nutrition", stream: "CulinaryArts" },
      { text: "Music Theory & Performance", stream: "CreativeArtsDesign" },
      { text: "Fine Arts & Art History", stream: "CreativeArtsDesign" }
    ]
  },
  {
    question: "Your ideal work environment would be:",
    options: [
      { text: "A tech lab or an engineering firm", stream: "Science (MPC)" },
      { text: "A hospital, research lab, or in nature", stream: "Science (BiPC)" },
      { text: "A corporate office or your own business", stream: "Commerce" },
      { text: "A design studio, a classroom, or a government office", stream: "Arts / Humanities" },
      { text: "An art studio, performance stage, or creative agency", stream: "CreativeArtsDesign" },
      { text: "A sports arena, gym, or outdoor training facility", stream: "SportsFitness" },
      { text: "A dynamic startup hub or working for myself", stream: "EntrepreneurshipInnovation" },
      { text: "A bustling kitchen or restaurant", stream: "CulinaryArts" },
      { text: "A recording studio or concert hall", stream: "CreativeArtsDesign" },
      { text: "An independent studio or gallery", stream: "CreativeArtsDesign" }
    ]
  },
  {
    question: "What kind of impact do you want to make in the world?",
    options: [
      { text: "Create technology that changes the world", stream: "Science (MPC)" },
      { text: "Improve people's health and well-being", stream: "Science (BiPC)" },
      { text: "Build a successful company and create jobs", stream: "Commerce" },
      { text: "Inspire people through art or contribute to society", stream: "Arts / Humanities" },
      { text: "Bring beauty and innovative solutions through design", stream: "CreativeArtsDesign" },
      { text: "Promote physical health and active lifestyles", stream: "SportsFitness" },
      { text: "Solve a major problem by building a new solution or company", stream: "EntrepreneurshipInnovation" },
      { text: "Create memorable dining experiences and culinary art", stream: "CulinaryArts" },
      { text: "Touch people's souls through music and performance", stream: "CreativeArtsDesign" },
      { text: "Evoke emotion and thought through visual creations", stream: "CreativeArtsDesign" }
    ]
  }
];

// Main App component
const App = () => {
  // Authentication states
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');

  // User profile state for username and mobile number
  const [userName, setUserName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [savingUserDetails, setSavingUserDetails] = useState(false);

  // Navigation state
  const [activeSection, setActiveSection] = useState('welcome');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Input form states for AI suggestions
  const [interests, setInterests] = useState('');
  const [strengths, setStrengths] = useState('');
  const [subjects, setSubjects] = useState('');
  const [careerSuggestions, setCareerSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // States for detailed career view
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [careerRoadmapDetails, setCareerRoadmapDetails] = useState(null);
  const [detailedInfoLoading, setDetailedInfoLoading] = useState(false);
  const [detailedInfoError, setDetailedInfoError] = useState('');

  // States for auto-suggestions for strengths and subjects
  const [autoSuggestLoading, setAutoSuggestLoading] = useState(false);
  const [autoSuggestError, setAutoSuggestError] = useState('');
  const [showAutoSuggestNote, setShowAutoSuggestNote] = useState(false);
  const autoSuggestTimeoutRef = useRef(null);

  // States for suggesting interests
  const [showInterestSuggestionsOption, setShowInterestSuggestionsOption] = useState(false);
  const [suggestedInterestsList, setSuggestedInterestsList] = useState([]);
  const [fetchingSuggestedInterests, setFetchingSuggestedInterests] = useState(false);
  const [suggestedInterestsError, setSuggestedInterestsError] = useState('');
  const interestsTextAreaRef = useRef(null);

  // Assessment states
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState([]);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState({});
  const [showAssessmentResults, setShowAssessmentResults] = useState(false);

  // State for saved careers (Firestore)
  const [savedCareers, setSavedCareers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Custom Modal state (for messages)
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Firebase Authentication & User Profile Effect ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Attempt to load user profile (username, mobile) from Firestore
        const userProfileDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${currentUser.uid}/profile/details`);
        try {
          const docSnap = await getDoc(userProfileDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserName(data.userName || '');
            setMobileNumber(data.mobileNumber || '');
            setShowUserDetailsModal(false); // Hide modal if profile exists
          } else {
            // No profile found, prompt user for details if not already shown
            if (!showUserDetailsModal) {
                setShowUserDetailsModal(true);
            }
          }
        } catch (profileError) {
          console.error("Error fetching user profile:", profileError);
          setAuthError(`Failed to load profile: ${profileError.message}.`);
          setShowUserDetailsModal(true); // Still prompt if there's an error
        }
      } else {
        // If no user is logged in, attempt anonymous sign-in
        try {
          await signInAnonymously(auth);
          // The onAuthStateChanged listener will fire again with the anonymous user,
          // which will then trigger the profile loading/prompt logic.
        } catch (anonymousAuthError) {
          console.error("Firebase Anonymous Auth Error:", anonymousAuthError);
          setAuthError(`Anonymous authentication failed: ${anonymousAuthError.message}. Please enable Anonymous sign-in in Firebase Auth.`);
        }
      }
      setIsAuthReady(true); // Auth state has been checked
    });

    return () => unsubscribe(); // Cleanup subscription
  }, [showUserDetailsModal]);

  // --- Firestore Data Listener Effect (for Saved Careers) ---
  useEffect(() => {
    let unsubscribe;
    if (user && isAuthReady && user.uid) {
      const userSavedCareersCollectionRef = collection(db, `artifacts/${firebaseConfig.projectId}/users/${user.uid}/savedCareers`);
      unsubscribe = onSnapshot(userSavedCareersCollectionRef, (snapshot) => {
        const careers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSavedCareers(careers);
      }, (error) => {
        console.error("Error fetching saved careers: ", error);
      });
    } else {
      setSavedCareers([]);
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, isAuthReady, db, firebaseConfig.projectId]);

  // --- User Details Handling (Username & Mobile Number) ---
  const handleSaveUserDetails = async () => {
    if (!userName.trim() || !mobileNumber.trim()) {
      showCustomModal('Input Required', 'Please enter both your name and mobile number.');
      return;
    }
    if (!/^\d{10}$/.test(mobileNumber.trim())) {
      showCustomModal('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!user || !user.uid) {
      showCustomModal('Error', 'Authentication not ready. Please try again or refresh.');
      return;
    }

    setSavingUserDetails(true);
    try {
      const userProfileDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${user.uid}/profile/details`);
      await setDoc(userProfileDocRef, {
        userName: userName.trim(),
        mobileNumber: mobileNumber.trim(),
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      setShowUserDetailsModal(false);
      showCustomModal('Welcome!', `Hello, ${userName}! Your details are saved.`);
    } catch (e) {
      console.error("Error saving user details: ", e);
      showCustomModal('Error', `Failed to save your details: ${e.message}.`);
    } finally {
      setSavingUserDetails(false);
    }
  };

  const handleLogout = async () => {
    setAuthError('');
    try {
      await signOut(auth);
      // Clear all user-specific data from state
      setInterests('');
      setStrengths('');
      setSubjects('');
      setCareerSuggestions([]);
      setSelectedCareer(null);
      setCareerRoadmapDetails(null);
      setShowAutoSuggestNote(false);
      setSuggestedInterestsList([]);
      setShowInterestSuggestionsOption(false);
      setUserName('');
      setMobileNumber('');
      setAssessmentAnswers([]);
      setCurrentQuestion(0);
      setAssessmentCompleted(false);
      setAssessmentResults({});
      setShowAssessmentResults(false);
      setSavedCareers([]);
      setActiveSection('welcome');
    } catch (error) {
      console.error("Logout error:", error);
      setAuthError(error.message);
    }
  };

  const showCustomModal = (title, content) => {
    setModalContent({ title, content });
    setIsModalOpen(true);
  };

  const closeCustomModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  // --- AI API Calls ---

  const makeGeminiApiCall = async (prompt, responseSchema) => {
    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = {
      contents: chatHistory,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}. Detail: ${errorText}`);
      }

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        const jsonString = result.candidates[0].content.parts[0].text;
        return JSON.parse(jsonString);
      } else {
        throw new Error('No valid content found in Gemini API response.');
      }
    } catch (err) {
      console.error('Gemini API call failed:', err);
      throw new Error(`Gemini API call failed: ${err.message}. Please check your API key and permissions.`);
    }
  };

  const getCareerSuggestions = async () => {
    setLoading(true);
    setError('');
    setCareerSuggestions([]);
    setSelectedCareer(null);
    setCareerRoadmapDetails(null);

    const prompt = `As an AI career counselor, provide 3-5 personalized career suggestions for a 10th-grade student based on the following information. Ensure a balance of traditional academic paths (like engineering, medicine, finance) and non-traditional/extracurricular-focused paths (like creative arts, sports, entrepreneurship, social work, chef, musician, artist, etc.). For each suggestion, include the career name, a brief one-sentence description, 2-3 key skills required, a general category (e.g., "Technology", "Healthcare", "Creative Arts", "Business", "Sports & Fitness", "Social Impact", "Culinary Arts", "Performing Arts"), and a brief indicator of current market demand (e.g., "High", "Medium", "Growing", "Stable", "Declining").
    Student's Interests: ${interests || 'No specific interests provided.'}
    Student's Strengths: ${strengths || 'No specific strengths provided.'}
    Favorite Subjects: ${subjects || 'No specific subjects provided.'}

    Format the output as a JSON array of objects, where each object has 'name', 'description', 'skills' (an array of strings), 'category', and 'marketDemand'.`;

    const schema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          "name": { "type": "STRING" },
          "description": { "type": "STRING" },
          "skills": { "type": "ARRAY", "items": { "type": "STRING" } },
          "category": { "type": "STRING" },
          "marketDemand": { "type": "STRING" }
        },
        "propertyOrdering": ["name", "description", "skills", "category", "marketDemand"]
      }
    };

    try {
      const parsedJson = await makeGeminiApiCall(prompt, schema);
      setCareerSuggestions(parsedJson);
      setActiveSection('suggestions');
    } catch (err) {
      setError(`Failed to fetch suggestions: ${err.message}.`);
    } finally {
      setLoading(false);
    }
  };

  const getCareerDetails = async (careerName) => {
    setDetailedInfoLoading(true);
    setDetailedInfoError('');
    setCareerRoadmapDetails(null);

    const prompt = `Provide a comprehensive career roadmap and detailed information for a 10th-grade student interested in becoming a "${careerName}". This should cover both traditional academic and non-traditional/extracurricular development paths. Include:
    1.  A detailed description of the career.
    2.  **Specific next steps immediately after 10th grade**, including:
        * **Recommended subject choices for 11th and 12th grade** (e.g., Science (PCM/PCB), Commerce, Arts, Vocational, or no specific academic stream if non-traditional).
        * **Important entrance exams or qualifying tests/auditions/portfolio requirements** (name them if applicable, e.g., JEE, NEET, CLAT, NID, NIFT, SAT, ACT, specific art school auditions, sports trials).
        * **Key skills to start developing now** (practical tips for a 10th grader, emphasizing both academic and practical/creative/physical skills).
        * **Relevant extracurricular activities or projects/competitions** to consider (e.g., coding clubs, debate, sports teams, art exhibitions, volunteering, business pitch competitions).
    3.  A step-by-step roadmap from 10th grade onwards (e.g., 11th grade, 12th grade, undergraduate/specialized training, postgraduate/further training, entry-level jobs/freelancing/startup).
    4.  Typical educational/training path (e.g., specific degrees, certifications, apprenticeships, self-taught progression).
    5.  Average salary range (as a general estimation, state if varies by region/experience/freelance).
    6.  Job outlook/growth potential (e.g., growing, stable, declining).
    7.  3-5 highly recommended books or online courses/platforms for developing key skills related to this career. For each resource, include its title, author/platform, a brief explanation of which skills it helps develop, and a URL link (if available, otherwise an empty string).

    Format the output as a JSON object with the following properties:
    {
      "name": "Career Name",
      "fullDescription": "Detailed description here.",
      "nextStepsAfter10th": {
        "subjectChoices": "Recommended subjects for 11th/12th grade",
        "entranceExams": ["Exam 1", "Exam 2"],
        "skillDevelopment": ["Practical skill 1", "Practical skill 2"],
        "extracurriculars": ["Activity 1", "Activity 2"]
      },
      "roadmap": ["Step 1", "Step 2", "Step 3", ...],
      "keySkills": ["Skill 1", "Skill 2", ...],
      "educationalPath": ["Education Step 1", "Education Step 2", ...],
      "salaryRange": "Average salary range",
      "jobOutlook": "Job outlook description",
      "recommendedResources": [
        { "title": "Resource Title 1", "authorOrPlatform": "Author/Platform 1", "relevanceToSkill": "Helps develop skill A, B", "url": "https://example.com/resource1" }
      ]
    }
    `;

    const schema = {
      type: "OBJECT",
      properties: {
        "name": { "type": "STRING" },
        "fullDescription": { "type": "STRING" },
        "nextStepsAfter10th": {
          "type": "OBJECT",
          "properties": {
            "subjectChoices": { "type": "STRING" },
            "entranceExams": { "type": "ARRAY", "items": { "type": "STRING" } },
            "skillDevelopment": { "type": "ARRAY", "items": { "type": "STRING" } },
            "extracurriculars": { "type": "ARRAY", "items": { "type": "STRING" } }
          },
          "propertyOrdering": ["subjectChoices", "entranceExams", "skillDevelopment", "extracurriculars"]
        },
        "roadmap": { "type": "ARRAY", "items": { "type": "STRING" } },
        "keySkills": { "type": "ARRAY", "items": { "type": "STRING" } },
        "educationalPath": { "type": "ARRAY", "items": { "type": "STRING" } },
        "salaryRange": { "type": "STRING" },
        "jobOutlook": { "type": "STRING" },
        "recommendedResources": {
          "type": "ARRAY",
          "items": {
            "type": "OBJECT",
            "properties": {
              "title": { "type": "STRING" },
              "authorOrPlatform": { "type": "STRING" },
              "relevanceToSkill": { "type": "STRING" },
              "url": { "type": "STRING" }
            },
            "propertyOrdering": ["title", "authorOrPlatform", "relevanceToSkill", "url"]
          }
        }
      },
      "propertyOrdering": ["name", "fullDescription", "nextStepsAfter10th", "roadmap", "keySkills", "educationalPath", "salaryRange", "jobOutlook", "recommendedResources"]
    };

    try {
      const parsedJson = await makeGeminiApiCall(prompt, schema);
      setCareerRoadmapDetails(parsedJson);
    } catch (err) {
      setDetailedInfoError(`Failed to fetch details: ${err.message}.`);
    } finally {
      setDetailedInfoLoading(false);
    }
  };

  const getAutoSuggestionsForInterests = async (currentInterests) => {
    if (!currentInterests.trim()) {
      setAutoSuggestLoading(false);
      setAutoSuggestError('');
      setShowAutoSuggestNote(false);
      setStrengths('');
      setSubjects('');
      return;
    }

    setAutoSuggestLoading(true);
    setAutoSuggestError('');
    setShowAutoSuggestNote(false);

    const prompt = `Based on the following student interests, suggest 3-5 relevant strengths and 3-5 relevant favorite subjects/areas of study/skills. These can include both academic and non-academic skills/areas. Provide the output as a JSON object with 'strengths' (an array of strings) and 'subjects' (an array of strings).
    Student's Interests: ${currentInterests}
    `;

    const schema = {
      type: "OBJECT",
      properties: {
        "strengths": { "type": "ARRAY", "items": { "type": "STRING" } },
        "subjects": { "type": "ARRAY", "items": { "type": "STRING" } }
      },
      "propertyOrdering": ["strengths", "subjects"]
    };

    try {
      const parsedJson = await makeGeminiApiCall(prompt, schema);
      setStrengths(parsedJson.strengths ? parsedJson.strengths.join(', ') : '');
      setSubjects(parsedJson.subjects ? parsedJson.subjects.join(', ') : '');
      setShowAutoSuggestNote(true);
    } catch (err) {
      setAutoSuggestError(`Failed to fetch auto-suggestions: ${err.message}.`);
    } finally {
      setAutoSuggestLoading(false);
    }
  };

  const fetchSuggestedInterests = async () => {
    setFetchingSuggestedInterests(true);
    setSuggestedInterestsError('');
    setSuggestedInterestsList([]);

    const prompt = `As an AI career counselor for 10th-grade students, provide a list of 7-10 diverse and common interests. These should be broad categories suitable for a student exploring career paths, encompassing both traditional academic areas and non-traditional fields like arts, sports, entrepreneurship, culinary arts, music, and visual arts. Format the output as a JSON array of strings.`;

    const schema = {
      type: "ARRAY",
      items: { "type": "STRING" }
    };

    try {
      const parsedJson = await makeGeminiApiCall(prompt, schema);
      setSuggestedInterestsList(parsedJson);
    } catch (err) {
      setSuggestedInterestsError(`Failed to fetch interest suggestions: ${err.message}.`);
    } finally {
      setFetchingSuggestedInterests(false);
    }
  };

  // --- Firestore Save/Delete Operations ---
  const saveCareer = async (careerDataToSave) => {
    if (!user || user.isAnonymous) {
      showCustomModal('Action Restricted', 'Please ensure you have provided your name and mobile number to save careers to your journey.');
      return;
    }
    setIsSaving(true);
    try {
      const userSavedCareersCollectionRef = collection(db, `artifacts/${firebaseConfig.projectId}/users/${user.uid}/savedCareers`);
      const docId = careerDataToSave.name.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(userSavedCareersCollectionRef, docId), careerDataToSave);
      showCustomModal('Success!', `${careerDataToSave.name} has been saved to your journey.`);
    } catch (e) {
      console.error("Error saving document: ", e);
      showCustomModal('Error', `Failed to save career: ${e.message}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const removeSavedCareer = async (careerId) => {
    if (!user || user.isAnonymous) {
      showCustomModal('Action Restricted', 'Please ensure you have provided your name and mobile number to remove saved careers.');
      return;
    }
    try {
      const docRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${user.uid}/savedCareers`, careerId);
      await deleteDoc(docRef);
      showCustomModal('Removed!', 'Career removed from your journey.');
    } catch (e) {
      console.error("Error removing document: ", e);
      showCustomModal('Error', `Failed to remove career: ${e.message}. Please try again.`);
    }
  };

  // --- Event Handlers & Utility Functions ---
  useEffect(() => {
    if (autoSuggestTimeoutRef.current) {
      clearTimeout(autoSuggestTimeoutRef.current);
    }

    if (interests.trim()) {
      setAutoSuggestLoading(true);
      autoSuggestTimeoutRef.current = setTimeout(() => {
        getAutoSuggestionsForInterests(interests);
      }, 700);
    } else {
      setAutoSuggestLoading(false);
      setAutoSuggestError('');
      setShowAutoSuggestNote(false);
      setStrengths('');
      setSubjects('');
    }

    return () => {
      if (autoSuggestTimeoutRef.current) {
        clearTimeout(autoSuggestTimeoutRef.current);
      }
    };
  }, [interests]);

  const handleInterestsFocus = () => {
    setShowInterestSuggestionsOption(true);
    if (suggestedInterestsList.length === 0 && !fetchingSuggestedInterests) {
      fetchSuggestedInterests();
    }
  };

  const handleInterestsBlur = () => {
    setTimeout(() => {
      if (!interests.trim() && interestsTextAreaRef.current && !interestsTextAreaRef.current.contains(document.activeElement)) {
        setShowInterestSuggestionsOption(false);
      }
    }, 100);
  };

  const handleCareerCardClick = (career) => {
    setSelectedCareer(career);
    getCareerDetails(career.name);
  };

  const applySuggestedInterests = () => {
    const currentInterestsArray = interests.split(',').map(item => item.trim()).filter(item => item !== '');
    const newInterestsArray = suggestedInterestsList.filter(item => !currentInterestsArray.includes(item));
    const combinedInterests = [...currentInterestsArray, ...newInterestsArray].join(', ');
    setInterests(combinedInterests);
    setShowInterestSuggestionsOption(false);
  };

  const groupCareersByCategory = (careers) => {
    return careers.reduce((acc, career) => {
      const category = career.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(career);
      return acc;
    }, {});
  };

  const categorizedSuggestions = groupCareersByCategory(careerSuggestions);

  const startAssessment = () => {
    setCurrentQuestion(0);
    setAssessmentAnswers([]);
    setAssessmentCompleted(false);
    setAssessmentResults({});
    setShowAssessmentResults(false);
    setActiveSection('assessment');
  };

  const handleAnswerSelection = (stream) => {
    const newAnswers = [...assessmentAnswers, stream];
    setAssessmentAnswers(newAnswers);

    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setAssessmentCompleted(true);
      const scores = newAnswers.reduce((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});

      const sortedStreams = Object.keys(scores).sort((a, b) => {
        if (scores[b] !== scores[a]) {
          return scores[b] - scores[a];
        }
        return a.localeCompare(b);
      });

      setAssessmentResults({ scores, topStreams: sortedStreams });
      setShowAssessmentResults(true);
    }
  };

  const getAssessmentTopRecommendation = () => {
    if (assessmentResults.topStreams && assessmentResults.topStreams.length > 0) {
      const topStreamKey = assessmentResults.topStreams[0];
      return staticCareerData[topStreamKey] || null;
    }
    return null;
  };

  const applyAssessmentResultsToAISuggestions = () => {
    const topRecommendation = getAssessmentTopRecommendation();
    if (topRecommendation) {
      setInterests(topRecommendation.description);
      setStrengths('');
      setSubjects('');
      setActiveSection('suggestions-form');
    } else {
      showCustomModal("No Recommendation", "Please complete the assessment first or try entering your details manually.");
    }
  };

  // Main App content render logic
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-stone-800 flex items-center justify-center font-sans">
        <Loader2 className="animate-spin w-12 h-12 text-amber-500" />
        <p className="ml-4 text-lg text-stone-300">Loading authentication...</p>
      </div>
    );
  }

  // Unified rendering logic based on user authentication and profile status
  // If user is not authenticated OR authenticated but no profile (name/mobile) exists
  if (!user || (!userName && showUserDetailsModal)) { // showUserDetailsModal only true if profile doesn't exist
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-stone-800 flex items-center justify-center font-sans">
          {showUserDetailsModal ? ( // Show details modal if user is authed but no profile
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="bg-stone-800 rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-md border border-stone-700 text-stone-100 text-center">
                <h3 className="text-2xl font-bold text-amber-400 mb-4">Tell Us About Yourself!</h3>
                <p className="text-stone-300 mb-6">This helps us personalize your journey.</p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-stone-200 mb-1 text-left">Your Name</label>
                    <input
                      type="text"
                      id="username"
                      className="w-full p-3 border-2 border-stone-600 rounded-lg focus:border-amber-500 transition-colors shadow-sm bg-stone-900 text-stone-100"
                      placeholder="e.g., Rohan, Priya"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="mobile" className="block text-sm font-medium text-stone-200 mb-1 text-left">Mobile Number</label>
                    <input
                      type="tel"
                      id="mobile"
                      className="w-full p-3 border-2 border-stone-600 rounded-lg focus:border-amber-500 transition-colors shadow-sm bg-stone-900 text-stone-100"
                      placeholder="e.g., 9876543210"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveUserDetails}
                  disabled={savingUserDetails}
                  className={`mt-6 w-full btn-dark-gradient text-lg px-8 py-3 hover:scale-105
                    ${savingUserDetails ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                >
                  {savingUserDetails ? (
                    <> <Loader2 className="animate-spin w-5 h-5 mr-3 inline-block" /> Saving... </>
                  ) : (
                    <> Start My Journey 🚀 </>
                  )}
                </button>
                {authError && (
                  <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative font-medium text-sm mt-4" role="alert">
                    {authError}
                  </div>
                )}
              </div>
            </div>
          ) : ( // Show a loading state or initial anonymous sign-in prompt if auth not fully ready
             <div className="text-center">
                <Loader2 className="animate-spin w-12 h-12 text-amber-500 mx-auto mb-4" />
                <p className="text-lg text-stone-300">Setting up your secure session...</p>
                {authError && (
                  <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative font-medium text-sm mt-4" role="alert">
                    {authError}
                  </div>
                )}
            </div>
          )}
        </div>
    );
  }

  // Render main app content only if user is authenticated AND profile (name/mobile) is loaded/provided
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-stone-800 p-4 font-sans text-stone-100 flex flex-col items-center">
      {/* Custom Modal Component (for messages) */}
      <div className={`fixed inset-0 bg-black bg-opacity-70 ${isModalOpen ? 'flex' : 'hidden'} items-center justify-center z-[100] p-4 animate-fadeIn`}>
        <div className="bg-stone-800 rounded-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto shadow-xl border border-stone-700 text-stone-100">
          <button onClick={closeCustomModal} className="absolute top-4 right-4 text-stone-400 hover:text-stone-200">
            <X className="w-6 h-6" />
          </button>
          {modalContent && (
            <>
              <h3 className="text-2xl font-bold text-amber-400 mb-4">{modalContent.title}</h3>
              <div className="text-stone-300">{modalContent.content}</div>
            </>
          )}
        </div>
      </div>

      {/* Header Section */}
      <header className="w-full max-w-5xl bg-stone-900/80 backdrop-blur-lg shadow-md sticky top-0 z-40 rounded-xl p-4 mb-6 flex justify-between items-center border border-stone-700">
        {/* Hamburger Menu Icon */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-full hover:bg-stone-700 transition-colors md:hidden text-stone-100"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center flex-grow justify-center md:justify-start">
          <span className="text-3xl md:text-4xl mr-3">🧭</span>
          <h1 className="text-xl md:text-2xl font-bold text-amber-400">Your Journey Begins</h1>
        </div>

        {/* Desktop Navigation (hidden on mobile) */}
        <nav className="hidden md:flex flex-wrap justify-center gap-2 md:gap-4">
          {[
            { id: 'welcome', label: 'Welcome', icon: Home },
            { id: 'assessment', label: 'Assessment', icon: Award },
            { id: 'suggestions-form', label: 'Suggestions', icon: Lightbulb },
            { id: 'my-journey', label: 'My Journey', icon: Layers },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'explore-streams', label: 'Explore Streams', icon: School },
            { id: 'resources', label: 'Resources', icon: Book }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setSelectedCareer(null);
              }}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full transition duration-300 ease-in-out nav-pill-dark ${
                activeSection === item.id ? 'active' : ''
              }`}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-red-300 bg-red-900 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition duration-200 ease-in-out ml-4"
        >
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </button>
      </header>

      {/* Sidebar Navigation for Mobile */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-stone-900 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:hidden`}
      >
        <div className="flex justify-end p-4">
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-full hover:bg-stone-700 transition-colors text-stone-100">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-2">
          {[
            { id: 'welcome', label: 'Welcome', icon: Home },
            { id: 'assessment', label: 'Assessment', icon: Award },
            { id: 'suggestions-form', label: 'Suggestions', icon: Lightbulb },
            { id: 'my-journey', label: 'My Journey', icon: Layers },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'explore-streams', label: 'Explore Streams', icon: School },
            { id: 'resources', label: 'Resources', icon: Book }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setSelectedCareer(null);
                setIsSidebarOpen(false);
              }}
              className={`inline-flex items-center px-4 py-3 text-base font-medium rounded-lg transition duration-300 ease-in-out nav-pill-dark w-full justify-start ${
                activeSection === item.id ? 'active' : ''
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overlay to close sidebar on outside click */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-5xl bg-stone-800 rounded-xl shadow-2xl p-6 md:p-10 border border-stone-700 text-stone-100">
        {activeSection === 'welcome' && (
          <section className="section active animate-fadeIn">
            <div className="p-8 md:p-12 rounded-xl text-center" style={{
              background: 'linear-gradient(135deg, #a0522d 0%, #d2691e 100%)', // Brown gradient
              boxShadow: '0 15px 40px rgba(160, 82, 45, 0.4)'
            }}>
              <div className="text-8xl mb-6 animate-bounce-once">🌟</div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">Welcome{userName ? `, ${userName}` : ''} to Your Future!</h2>
              <p className="text-lg text-stone-100 max-w-3xl mx-auto mb-8 leading-relaxed opacity-90 drop-shadow-sm">
                Every student's journey is unique. Let's discover yours together and create a personalized roadmap to a future you're excited about. Your future starts with the choices you make today.
              </p>
              <button className="btn-dark-gradient text-lg px-8 py-4 hover:scale-105" onClick={() => setActiveSection('assessment')}>
                🚀 Start My Journey
              </button>
            </div>
          </section>
        )}

        {activeSection === 'assessment' && (
          <section className="section active animate-fadeIn">
            {!assessmentCompleted && (
              <div className="glass-card-dark p-8 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-amber-400 mb-8 text-center">Discover Your Strengths</h2>
                <p className="text-center text-stone-300 mb-8">Answer a few questions to understand your interests and get personalized stream recommendations.</p>

                {assessmentQuestions.length > 0 && (
                  <div className="mb-8">
                    <p className="text-sm font-semibold text-amber-500">Question {currentQuestion + 1} of {assessmentQuestions.length}</p>
                    <div className="w-full bg-stone-700 rounded-full h-2.5 mt-1">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-red-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${((currentQuestion) / assessmentQuestions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <h3 className="text-2xl font-bold text-stone-100 mb-6">{assessmentQuestions[currentQuestion]?.question}</h3>
                <div className="space-y-4">
                  {assessmentQuestions[currentQuestion]?.options.map((opt, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelection(opt.stream)}
                      className="w-full text-left p-4 glass-card-dark hover:bg-stone-700 transition-colors text-lg font-medium rounded-lg text-stone-100"
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showAssessmentResults && (
              <div className="glass-card-dark p-8 max-w-4xl mx-auto text-center animate-fadeIn">
                <h2 className="text-3xl font-bold text-amber-400 mb-4">Assessment Complete!</h2>
                <p className="text-lg text-stone-300 mb-8">Hi {userName || 'there'}, based on your answers, here are the career paths that align best with you.</p>

                <div className="bg-stone-700 p-6 rounded-2xl border border-stone-600 shadow-lg mb-8">
                  <p className="text-amber-500 font-bold text-xl mb-2">Your Top Recommendation</p>
                  {getAssessmentTopRecommendation() && (
                    <>
                      <h3 className="text-3xl font-bold text-stone-100 mt-1 mb-4">
                        {getAssessmentTopRecommendation().emoji} {getAssessmentTopRecommendation().title}
                      </h3>
                      <p className="text-stone-300 mb-6">{getAssessmentTopRecommendation().description}</p>
                      <button
                        className="btn-dark-gradient px-6 py-3 text-lg hover:scale-105"
                        onClick={applyAssessmentResultsToAISuggestions}
                      >
                        <Lightbulb className="inline-block w-6 h-6 mr-2" /> Get AI Suggestions Based on This
                      </button>
                    </>
                  )}
                </div>

                <div className="text-center">
                  <button
                    className="btn-dark-gradient px-6 py-3 hover:scale-105"
                    onClick={() => setActiveSection('my-journey')}
                  >
                    <ChevronRight className="inline-block w-5 h-5 mr-2" /> See My Full Journey
                  </button>
                  <button
                    className="ml-4 text-amber-500 font-semibold px-4 py-2 rounded-full hover:bg-stone-700 transition-colors"
                    onClick={startAssessment}
                  >
                    Retake Assessment
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {(activeSection === 'suggestions-form' || activeSection === 'suggestions') && (
          <section className="section active animate-fadeIn">
            {!selectedCareer ? (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-semibold text-amber-400 mb-5 flex items-center">
                  <User className="w-6 h-6 mr-2" /> Tell Us About Yourself
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="interests" className="block text-sm font-medium text-stone-200 mb-2 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-1 text-amber-500" /> Your Interests
                    </label>
                    <textarea
                      id="interests"
                      ref={interestsTextAreaRef}
                      className="w-full p-3 border border-stone-600 rounded-lg focus:ring-amber-500 focus:border-amber-500 shadow-sm transition duration-200 ease-in-out resize-y min-h-[80px] bg-stone-900 text-stone-100"
                      placeholder="e.g., technology, art, helping people, nature, sports, reading, cooking, gaming"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      onFocus={handleInterestsFocus}
                      onBlur={handleInterestsBlur}
                      rows="3"
                    ></textarea>
                  </div>

                  <div>
                    <label htmlFor="strengths" className="block text-sm font-medium text-stone-200 mb-2 flex items-center">
                      <GraduationCap className="w-4 h-4 mr-1 text-amber-500" /> Your Strengths
                      {autoSuggestLoading && <Loader2 className="animate-spin w-4 h-4 ml-2 text-amber-500" />}
                    </label>
                    <textarea
                      id="strengths"
                      className="w-full p-3 border border-stone-600 rounded-lg focus:ring-amber-500 focus:border-amber-500 shadow-sm transition duration-200 ease-in-out resize-y min-h-[80px] bg-stone-900 text-stone-100"
                      placeholder="e.g., problem-solving, creativity, communication, leadership, analytical thinking, physical coordination, artistic talent"
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      rows="3"
                    ></textarea>
                  </div>

                  <div>
                    <label htmlFor="subjects" className="block text-sm font-medium text-stone-200 mb-2 flex items-center">
                      <BookOpen className="w-4 h-4 mr-1 text-amber-500" /> Favorite Subjects/Areas
                      {autoSuggestLoading && <Loader2 className="animate-spin w-4 h-4 ml-2 text-amber-500" />}
                    </label>
                    <textarea
                      id="subjects"
                      className="w-full p-3 border border-stone-600 rounded-lg focus:ring-amber-500 focus:border-amber-500 shadow-sm transition duration-200 ease-in-out resize-y min-h-[80px] bg-stone-900 text-stone-100"
                      placeholder="e.g., Math, Science, English, Computer Science, History, Arts, Physical Education, Entrepreneurship, Psychology"
                      value={subjects}
                      onChange={(e) => setSubjects(e.target.value)}
                      rows="3"
                    ></textarea>
                  </div>
                </div>

                {autoSuggestError && (
                  <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mt-4 font-medium" role="alert">
                    <strong className="font-bold">Auto-Suggestion Error:</strong>
                    <span className="block sm:inline ml-2">{autoSuggestError}</span>
                  </div>
                )}

                {showAutoSuggestNote && !autoSuggestLoading && !autoSuggestError && (
                  <div className="mt-4 p-4 bg-stone-700 border border-stone-600 text-amber-400 text-base rounded-xl shadow-lg text-center animate-pulse-once">
                    <p className="font-semibold">🌟 We've suggested **strengths and subjects/areas** aligned with your interests. Feel free to adjust them!</p>
                  </div>
                )}

                {showInterestSuggestionsOption && (
                  <div className="mt-6 p-4 bg-stone-900 border border-stone-700 rounded-xl shadow-inner">
                    <h3 className="text-lg font-semibold text-stone-200 mb-3 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-amber-500" /> Unsure about your interests? Try these:
                    </h3>
                    {fetchingSuggestedInterests && (
                      <div className="flex items-center justify-center py-4 text-stone-300">
                        <Loader2 className="animate-spin w-5 h-5 mr-3" />
                        <p>Loading suggestions...</p>
                      </div>
                    )}
                    {suggestedInterestsError && (
                      <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative font-medium" role="alert">
                        <strong className="font-bold">Error:</strong>
                        <span className="block sm:inline ml-2">{suggestedInterestsError}</span>
                      </div>
                    )}
                    {suggestedInterestsList.length > 0 && !fetchingSuggestedInterests && (
                      <>
                        <p className="text-stone-300 text-sm mb-3">Click on an interest to add it to your input:</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {suggestedInterestsList.map((interest, index) => (
                            <button
                              key={index}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                const currentInterestsArray = interests.split(',').map(item => item.trim()).filter(item => item !== '');
                                if (!currentInterestsArray.includes(interest)) {
                                  setInterests(prev => (prev ? `${prev}, ${interest}` : interest));
                                }
                                if (interestsTextAreaRef.current) {
                                  interestsTextAreaRef.current.focus();
                                }
                              }}
                              className="bg-stone-700 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500 hover:bg-stone-600 transition-colors duration-200 cursor-pointer"
                            >
                              {interest}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={applySuggestedInterests}
                          className="w-full px-6 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-stone-100 bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition duration-200 ease-in-out"
                        >
                          Use All Suggested Interests
                        </button>
                      </>
                    )}
                    {suggestedInterestsList.length === 0 && !fetchingSuggestedInterests && !suggestedInterestsError && (
                      <p className="text-stone-400 text-center py-4">No suggestions available at the moment. Try describing some broad areas you might like.</p>
                    )}
                  </div>
                )}

                <div className="mt-8 text-center">
                  <button
                    onClick={getCareerSuggestions}
                    disabled={loading || !interests.trim() || !strengths.trim() || !subjects.trim()}
                    className={`inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-lg transition duration-300 ease-in-out transform btn-dark-gradient
                      ${loading
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:scale-105'
                      }
                    `}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5 mr-3" /> Generating...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-3" /> Get Personalized Suggestions
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mt-6 font-medium" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                  </div>
                )}

                {Object.keys(categorizedSuggestions).length > 0 && (
                  <section className="mt-10 animate-fadeIn">
                    <h2 className="text-2xl font-semibold text-amber-400 mb-5 flex items-center">
                      <Briefcase className="w-6 h-6 mr-2" /> Your Career Paths
                    </h2>
                    <p className="text-sm text-stone-400 mb-6 italic text-center">
                      Market demand insights are based on generalized trends from the model's knowledge cutoff and may not reflect real-time market fluctuations.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(categorizedSuggestions).map(([category, careers]) => (
                        <div key={category} className="col-span-full mb-8">
                          <h3 className="text-xl font-bold text-amber-500 mb-4 flex items-center">
                            <Tag className="w-5 h-5 mr-2 text-amber-500" /> {category}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {careers.map((career, index) => (
                              <div
                                key={index}
                                onClick={() => handleCareerCardClick(career)}
                                className="bg-stone-900 border border-stone-700 rounded-xl shadow-md p-6 flex flex-col justify-between transition duration-300 ease-in-out hover:shadow-lg hover:border-amber-500 cursor-pointer career-path-card-dark"
                              >
                                <div>
                                  <h4 className="text-xl font-bold text-amber-400 mb-2">{career.name}</h4>
                                  <p className="text-stone-300 text-sm mb-3">{career.description}</p>
                                  <p className="text-sm font-medium text-stone-400 mb-2">Key Skills:</p>
                                  <ul className="list-disc list-inside text-stone-300 text-sm space-y-1">
                                    {career.skills.map((skill, skillIndex) => (
                                      <li key={skillIndex}>{skill}</li>
                                    ))}
                                  </ul>
                                </div>
                                {career.marketDemand && (
                                  <div className="mt-3 text-sm font-semibold flex items-center text-stone-400">
                                    <TrendingUpIcon className="w-4 h-4 mr-2 text-green-500" />
                                    Market Demand: <span className="ml-1 text-amber-300">{career.marketDemand}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {careerSuggestions.length === 0 && !loading && !error && activeSection === 'suggestions-form' && (
                  <div className="text-center text-stone-400 py-10">
                    <p className="text-lg">Enter your details above and click "Get Personalized Suggestions" to explore your future!</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <section className="animate-fadeIn">
                  <button
                    onClick={() => setSelectedCareer(null)}
                    className="inline-flex items-center text-amber-400 hover:text-amber-500 transition duration-200 ease-in-out mb-6 font-semibold"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Suggestions
                  </button>

                  <h2 className="text-3xl font-bold text-amber-400 mb-4 flex items-center">
                    <Briefcase className="w-8 h-8 mr-3" /> {selectedCareer.name}
                  </h2>

                  {detailedInfoLoading && (
                    <div className="flex items-center justify-center py-10 text-amber-400">
                      <Loader2 className="animate-spin w-8 h-8 mr-3" />
                      <p className="text-lg">Loading detailed roadmap...</p>
                    </div>
                  )}

                  {detailedInfoError && (
                    <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6 font-medium" role="alert">
                      <strong className="font-bold">Error:</strong>
                      <span className="block sm:inline ml-2">{detailedInfoError}</span>
                    </div>
                  )}

                  {careerRoadmapDetails && (
                    <div className="space-y-6">
                      <div className="text-right mb-4">
                        <button
                          onClick={() => saveCareer(careerRoadmapDetails)}
                          disabled={isSaving || savedCareers.some(c => c.name === careerRoadmapDetails.name)}
                          className={`inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-full shadow-sm transition duration-300 ease-in-out
                            ${isSaving || savedCareers.some(c => c.name === careerRoadmapDetails.name)
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-700 to-emerald-800 text-white hover:from-green-800 hover:to-emerald-900 hover:scale-105'
                            }
                          `}
                        >
                          {isSaving ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                          {savedCareers.some(c => c.name === careerRoadmapDetails.name) ? 'Saved to My Journey' : 'Save to My Journey'}
                        </button>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-amber-400 mb-2">Description</h3>
                        <p className="text-stone-300 leading-relaxed">{careerRoadmapDetails.fullDescription}</p>
                      </div>

                      <div className="bg-stone-900 border border-stone-700 rounded-xl shadow-md p-5 mt-6">
                        <h3 className="text-xl font-bold text-amber-400 mb-3 flex items-center">
                          <Target className="w-6 h-6 mr-2 text-amber-500" /> Your Next Steps After 10th Grade
                        </h3>
                        <div className="space-y-4">
                          {careerRoadmapDetails.nextStepsAfter10th.subjectChoices && (
                            <div>
                              <p className="font-semibold text-stone-200 flex items-center mb-1">
                                <ListChecks className="w-4 h-4 mr-2 text-amber-500" /> Recommended Subject Choices for 11th/12th:
                              </p>
                              <p className="text-stone-300 ml-6">{careerRoadmapDetails.nextStepsAfter10th.subjectChoices}</p>
                            </div>
                          )}
                          {careerRoadmapDetails.nextStepsAfter10th.entranceExams && careerRoadmapDetails.nextStepsAfter10th.entranceExams.length > 0 && (
                            <div>
                              <p className="font-semibold text-stone-200 flex items-center mb-1">
                                <ClipboardList className="w-4 h-4 mr-2 text-amber-500" /> Important Entrance Exams/Requirements:
                              </p>
                              <ul className="list-disc list-inside text-stone-300 ml-6 space-y-1">
                                {careerRoadmapDetails.nextStepsAfter10th.entranceExams.map((exam, idx) => (
                                  <li key={idx}>{exam}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {careerRoadmapDetails.nextStepsAfter10th.skillDevelopment && careerRoadmapDetails.nextStepsAfter10th.skillDevelopment.length > 0 && (
                            <div>
                              <p className="font-semibold text-stone-200 flex items-center mb-1">
                                <Lightbulb className="w-4 h-4 mr-2 text-amber-500" /> Skills to Start Developing Now:
                              </p>
                              <ul className="list-disc list-inside text-stone-300 ml-6 space-y-1">
                                {careerRoadmapDetails.nextStepsAfter10th.skillDevelopment.map((skill, idx) => (
                                  <li key={idx}>{skill}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {careerRoadmapDetails.nextStepsAfter10th.extracurriculars && careerRoadmapDetails.nextStepsAfter10th.extracurriculars.length > 0 && (
                            <div>
                              <p className="font-semibold text-stone-200 flex items-center mb-1">
                                <Sparkles className="w-4 h-4 mr-2 text-amber-500" /> Relevant Extracurricular Activities/Projects:
                              </p>
                              <ul className="list-disc list-inside text-stone-300 ml-6 space-y-1">
                                {careerRoadmapDetails.nextStepsAfter10th.extracurriculars.map((activity, idx) => (
                                  <li key={idx}>{activity}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-amber-400 mb-4 flex items-center">
                          <School className="w-5 h-5 mr-2 text-amber-500" /> Overall Career Roadmap
                        </h3>
                        <div className="relative border-l-2 border-stone-600 pl-6 ml-4 py-2 roadmap-timeline-dark">
                          {careerRoadmapDetails.roadmap.map((step, index) => (
                            <div key={index} className="mb-8 last:mb-0 relative roadmap-item-dark">
                              <div className="absolute -left-4 top-0 flex items-center justify-center w-8 h-8 bg-amber-600 text-stone-900 rounded-full font-bold text-sm border-2 border-stone-800 shadow-md roadmap-dot-dark">
                                {index + 1}
                              </div>
                              <div className="bg-stone-900 border border-stone-700 rounded-lg p-4 transition duration-300 ease-in-out hover:shadow-lg hover:border-amber-500">
                                <h4 className="font-semibold text-amber-400 mb-1">Step {index + 1}</h4>
                                <p className="text-stone-300 text-sm leading-snug">{step}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-amber-400 mb-2 flex items-center">
                          <Lightbulb className="w-5 h-5 mr-2 text-amber-500" /> Broader Key Skills to Develop
                        </h3>
                        <ul className="list-disc list-inside text-stone-300 space-y-1 pl-4">
                          {careerRoadmapDetails.keySkills.map((skill, index) => (
                            <li key={index} className="text-base">{skill}</li>
                          ))}
                        </ul>
                      </div>

                      {careerRoadmapDetails.recommendedResources && careerRoadmapDetails.recommendedResources.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold text-amber-400 mb-2 flex items-center">
                            <BookText className="w-5 h-5 mr-2 text-amber-500" /> Recommended Resources
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {careerRoadmapDetails.recommendedResources.map((resource, index) => (
                              <div key={index} className="bg-stone-900 border border-stone-700 rounded-lg p-4 shadow-sm">
                                <h4 className="font-semibold text-stone-200 text-base">
                                  {resource.url ? (
                                    <a
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-amber-400 hover:underline hover:text-amber-500 transition-colors duration-200"
                                    >
                                      {resource.title}
                                    </a>
                                  ) : (
                                    resource.title
                                  )}
                                </h4>
                                <p className="text-sm text-stone-300 mt-1">
                                  <span className="font-medium">By/Platform:</span> {resource.authorOrPlatform}
                                </p>
                                <p className="text-sm text-stone-300 mt-1">
                                  <span className="font-medium">Focus:</span> {resource.relevanceToSkill}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="text-xl font-semibold text-amber-400 mb-2 flex items-center">
                          <GraduationCap className="w-5 h-5 mr-2 text-amber-500" /> Overall Educational/Training Path
                        </h3>
                        <ul className="list-disc list-inside text-stone-300 space-y-1 pl-4">
                          {careerRoadmapDetails.educationalPath.map((path, index) => (
                            <li key={index} className="text-base">{path}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-xl font-semibold text-amber-400 mb-2 flex items-center">
                            <DollarSign className="w-5 h-5 mr-2 text-amber-500" /> Average Salary Range
                          </h3>
                          <p className="text-stone-300 text-base">{careerRoadmapDetails.salaryRange}</p>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-amber-400 mb-2 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-amber-500" /> Job Outlook
                          </h3>
                          <p className="text-stone-300 text-base">{careerRoadmapDetails.jobOutlook}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}

            {activeSection === 'my-journey' && (
              <section className="section active animate-fadeIn">
                <div className="glass-card-dark p-8 max-w-4xl mx-auto text-center">
                  <h2 className="text-3xl font-bold text-amber-400 mb-8">
                    <Layers className="inline-block w-8 h-8 mr-2" /> My Saved Journey
                  </h2>
                  {!assessmentCompleted && (
                    <p className="text-lg text-stone-300 mb-8">Complete your <span className="font-semibold text-amber-500 cursor-pointer hover:underline" onClick={() => setActiveSection('assessment')}>Assessment</span> to unlock your personalized journey and roadmap.</p>
                  )}
                  {assessmentCompleted && getAssessmentTopRecommendation() && (
                    <div className="text-left">
                      <p className="text-lg text-stone-300 mb-6">
                        Hello {userName || 'future leader'}! Based on your assessment, your top recommended stream is:
                      </p>
                      <div className="bg-stone-900 p-6 rounded-2xl border border-stone-700 shadow-lg mb-8">
                        <h3 className="text-2xl font-bold text-amber-400 mb-3 flex items-center">
                          {getAssessmentTopRecommendation().emoji} {getAssessmentTopRecommendation().title}
                        </h3>
                        <p className="text-stone-300 leading-relaxed mb-4">{getAssessmentTopRecommendation().description}</p>
                        <h4 className="text-xl font-semibold text-amber-400 mb-3">Key Careers in this Stream:</h4>
                        <ul className="list-disc list-inside text-stone-300 space-y-2 mb-6">
                          {getAssessmentTopRecommendation().careers.slice(0, 3).map((career, idx) => (
                            <li key={idx} className="text-base font-medium">
                              <span className="text-amber-500">{career.name}:</span> {career.description}
                              <button
                                onClick={() => {
                                  setSelectedCareer({ name: career.name });
                                  getCareerDetails(career.name);
                                  setActiveSection('suggestions');
                                }}
                                className="ml-3 text-amber-400 hover:underline text-sm font-semibold"
                              >
                                View Details <ChevronRight className="inline-block w-4 h-4 ml-1" />
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="text-center">
                          <button
                            className="btn-dark-gradient px-6 py-3 hover:scale-105"
                            onClick={() => setActiveSection('suggestions-form')}
                          >
                            <Lightbulb className="inline-block w-5 h-5 mr-2" /> Get AI Suggestions
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {savedCareers.length === 0 && assessmentCompleted && (
                     <div className="text-center text-stone-400 py-10 border border-dashed border-stone-700 rounded-lg p-6">
                       <p className="text-lg">No saved careers yet.</p>
                       <p className="mt-2 text-md">Explore career suggestions and click 'Save to My Journey' to add them here!</p>
                       <button
                         onClick={() => setActiveSection('suggestions-form')}
                         className="mt-6 inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-stone-100 bg-amber-500 hover:bg-amber-600 transition duration-200 ease-in-out"
                       >
                         <Briefcase className="w-4 h-4 mr-2" /> Find Careers Now
                       </button>
                     </div>
                   )}

                   {savedCareers.length > 0 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                       {savedCareers.map((career) => (
                         <div
                           key={career.id}
                           className="bg-stone-900 border border-stone-700 rounded-xl shadow-md p-6 flex flex-col justify-between transition duration-300 ease-in-out hover:shadow-lg hover:border-amber-500 relative"
                         >
                           <button
                             onClick={(e) => { e.stopPropagation(); removeSavedCareer(career.id); }}
                             className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors duration-200"
                             title="Remove from saved"
                           >
                             <XCircle className="w-5 h-5" />
                           </button>
                           <div onClick={() => handleCareerCardClick(career)} className="cursor-pointer">
                             <h4 className="text-xl font-bold text-amber-400 mb-2">{career.name}</h4>
                             <p className="text-stone-300 text-sm mb-3">{career.fullDescription?.substring(0, 80)}...</p>
                             <p className="text-sm font-medium text-stone-400 mb-2">Key Skills:</p>
                             <ul className="list-disc list-inside text-stone-300 text-sm space-y-1">
                               {career.keySkills?.slice(0, 2).map((skill, skillIndex) => (
                                 <li key={skillIndex}>{skill}</li>
                               ))}
                               {career.keySkills?.length > 2 && <li>...</li>}
                             </ul>
                             <div className="mt-3 text-sm font-semibold flex items-center text-stone-400">
                               <TrendingUpIcon className="w-4 h-4 mr-2 text-green-500" />
                               Job Outlook: <span className="ml-1 text-amber-300">{career.jobOutlook}</span>
                             </div>
                           </div>
                           <button
                             onClick={() => handleCareerCardClick(career)}
                             className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-amber-400 bg-stone-700 hover:bg-stone-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition duration-200 ease-in-out"
                           >
                             View Full Roadmap <ChevronRight className="w-4 h-4 ml-2" />
                           </button>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              </section>
            )}

            {activeSection === 'profile' && (
              <section className="section active animate-fadeIn">
                <div className="glass-card-dark p-8 max-w-xl mx-auto">
                  <h2 className="text-3xl font-bold text-amber-400 mb-6 text-center">
                    <SquareUserRound className="inline-block w-8 h-8 mr-2" /> Your Profile
                  </h2>
                  <div className="space-y-4 text-lg text-stone-300">
                    <p><span className="font-semibold text-amber-400">Name:</span> {userName || 'Not set'}</p>
                    <p><span className="font-semibold text-amber-400">Mobile Number:</span> {mobileNumber || 'Not set'}</p>
                    {user?.uid && (
                      <p className="text-sm text-stone-400">Your User ID: <span className="font-mono text-xs break-all">{user.uid}</span></p>
                    )}
                  </div>
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => showCustomModal('Coming Soon!', 'Profile editing and more features will be available in future updates!')}
                      className="btn-dark-gradient px-6 py-3 hover:scale-105"
                    >
                      <Settings className="inline-block w-5 h-5 mr-2" /> Edit Profile (Coming Soon)
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'explore-streams' && (
              <section className="section active animate-fadeIn">
                <h2 className="text-3xl font-bold text-amber-400 mb-8 text-center">
                  <School className="inline-block w-8 h-8 mr-2" /> Explore Academic Streams
                </h2>
                <p className="text-stone-300 mb-6 text-center">
                  Discover common career paths associated with different academic and non-academic streams. Click on a career to get a detailed AI-generated roadmap.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(staticCareerData).map(([streamKey, stream]) => (
                    <div key={streamKey} className="stream-card glass-card-dark p-6 text-center transition duration-300 ease-in-out hover:shadow-lg hover:border-amber-500">
                      <div className="text-4xl mb-3">{stream.emoji}</div>
                      <h3 className="text-2xl font-bold mb-2 text-stone-100">{stream.title}</h3>
                      <p className="text-stone-300 mb-4 text-sm">{stream.description}</p>
                      <button
                        className="btn-dark-gradient w-full px-6 py-3 text-lg hover:scale-105"
                        onClick={() => {
                          showCustomModal(
                            `${stream.emoji} ${stream.title} Careers`,
                            <div>
                              <p className="text-stone-300 mb-4">{stream.description}</p>
                              <h4 className="text-xl font-bold text-amber-400 mb-3">Popular Career Paths:</h4>
                              {stream.careers.map((career, idx) => (
                                <div key={idx} className="bg-stone-900 p-4 mb-2 rounded-lg border border-stone-700 flex flex-col sm:flex-row justify-between items-center text-left text-stone-100">
                                  <div className="mb-2 sm:mb-0">
                                    <h5 className="font-semibold text-lg text-stone-100">{career.name}</h5>
                                    <p className="text-sm text-stone-300">{career.description}</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      closeCustomModal();
                                      handleCareerCardClick(career);
                                      setActiveSection('suggestions');
                                    }}
                                    className="btn-dark-gradient text-sm px-4 py-2 hover:scale-105 mt-2 sm:mt-0"
                                  >
                                    View Roadmap
                                  </button>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      >
                        Explore {stream.title}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === 'resources' && (
              <section className="section active animate-fadeIn">
                <h2 className="text-3xl font-bold text-amber-400 mb-8 text-center">
                  <Book className="inline-block w-8 h-8 mr-2" /> Helpful Resources
                </h2>
                <p className="text-stone-300 mb-6 text-center">
                  Find valuable information and external links to support your career journey.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-stone-900 p-6 rounded-xl border border-stone-700 shadow-md">
                    <h4 className="font-bold text-xl mb-3 text-amber-400 flex items-center"><DollarSign className="w-5 h-5 mr-2" /> Scholarship Portals</h4>
                    <ul className="space-y-2 text-stone-300">
                      <li><a href="https://scholarships.gov.in/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">National Scholarship Portal</a></li>
                      <li><a href="https://www.buddy4study.com/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">Buddy4Study</a></li>
                      <li><a href="https://www.finaid.org/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">FinAid!</a></li>
                    </ul>
                  </div>
                  <div className="bg-stone-900 p-6 rounded-xl border border-stone-700 shadow-md">
                    <h4 className="font-bold text-xl mb-3 text-amber-400 flex items-center"><FileText className="w-5 h-5 mr-2" /> Entrance Exam Info</h4>
                    <ul className="space-y-2 text-stone-300">
                      <li><a href="https://jeemain.nta.nic.in/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">JEE Main (Engineering)</a></li>
                      <li><a href="https://neet.nta.nic.in/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">NEET (Medical)</a></li>
                      <li><a href="https://www.icai.org/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">CA Foundation (Commerce)</a></li>
                      <li><a href="https://www.clat.ac.in/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">CLAT (Law)</a></li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-stone-400 mt-6 text-center italic">
                  *Additional resources can be found within the detailed roadmaps generated by the AI.*
                </p>
              </section>
            )}
          </main>
        </div> 
  );
};

export default App;
