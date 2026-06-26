import React, { useState, useEffect } from "react";
import "./App.css";
import "./styles/components.css";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";
import Home from "./components/Home";
import StudentLogin from "./components/StudentLogin";
import StudentVote from "./components/StudentVote";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import AdminDashboard from "./components/AdminDashboard";
import { initializeCandidates, normalizeCandidates } from "./utils/votingData";
import { db } from "./firebase";
import { doc, setDoc, getDoc, onSnapshot, runTransaction } from "firebase/firestore";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function App() {
  const [screen, setScreen] = useState("home");
  const [userType, setUserType] = useState(null); // 'student', 'teacher', null
  const [user, setUser] = useState(null);
  const [candidates, setCandidates] = useState(() => initializeCandidates());
  const [votes, setVotes] = useState([]);
  const [adminName, setAdminName] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [session, setSession] = useState(null);
  const [savedVoterEntry, setSavedVoterEntry] = useState(null);

  useEffect(() => {
    const quickEntry = localStorage.getItem('quickVoterEntry');
    if (quickEntry) {
      try {
        setSavedVoterEntry(JSON.parse(quickEntry));
      } catch (err) {
        console.error('Invalid quick voter data:', err);
      }
    }

    let existingDeviceId = localStorage.getItem('voterDeviceId');
    if (!existingDeviceId) {
      existingDeviceId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem('voterDeviceId', existingDeviceId);
    }
    setDeviceId(existingDeviceId);
  }, []);

  // Load data from Firestore on mount
  useEffect(() => {
    const initializeData = async () => {
      // Initialize candidates if not exists
      const candidatesRef = doc(db, 'voting', 'candidates');
      const candidatesSnap = await getDoc(candidatesRef);
      if (!candidatesSnap.exists()) {
        await setDoc(candidatesRef, { candidates: initializeCandidates() });
      }

      // Initialize votes if not exists
      const votesRef = doc(db, 'voting', 'votes');
      const votesSnap = await getDoc(votesRef);
      if (!votesSnap.exists()) {
        await setDoc(votesRef, { votes: [] });
      }

      const sessionRef = doc(db, 'voting', 'session');
      const sessionSnap = await getDoc(sessionRef);
      if (!sessionSnap.exists()) {
        await setDoc(sessionRef, { status: 'idle' });
      }
    };

    initializeData();

    // Listen for candidates updates
    const candidatesRef = doc(db, 'voting', 'candidates');
    const unsubscribeCandidates = onSnapshot(candidatesRef, (docSnap) => {
      if (docSnap.exists()) {
        try {
          setCandidates(normalizeCandidates(docSnap.data().candidates));
        } catch (e) {
          console.error('Error loading candidates:', e);
        }
      }
    });

    // Listen for votes updates
    const votesRef = doc(db, 'voting', 'votes');
    const unsubscribeVotes = onSnapshot(votesRef, (docSnap) => {
      if (docSnap.exists()) {
        try {
          setVotes(docSnap.data().votes || []);
        } catch (e) {
          console.error('Error loading votes:', e);
        }
      }
    });

    const sessionRef = doc(db, 'voting', 'session');
    const unsubscribeSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setSession(docSnap.data());
      } else {
        setSession(null);
      }
    });

    return () => {
      unsubscribeCandidates();
      unsubscribeVotes();
      unsubscribeSession();
    };
  }, []);

  useEffect(() => {
    if (session?.status === 'voting' && session.activeUser) {
      setUser(session.activeUser);
      setUserType(session.activeUser.type);
      setScreen('voting');
      return;
    }

    if (screen === 'voting' && user) {
      return;
    }

    if (screen !== 'login' && screen !== 'adminLogin' && screen !== 'adminPanel' && screen !== 'adminDashboard') {
      setUser(null);
      setUserType(null);
      setScreen('home');
    }
  }, [session, screen, user]);

  const handleStartVoting = (type) => {
    if (session?.status === 'voting') {
      setScreen('voting');
      return;
    }

    setUserType(type);
    setScreen("login");
  };

  const getVoterKey = (userData) => {
    const parts = [
      userData.type,
      userData.voterId || userData.name,
      userData.grade || "teacher",
      userData.group || "none"
    ];
    return parts.map((part) => String(part).trim().toLowerCase()).join("|");
  };

  const handleSaveQuickVoter = (voterData) => {
    localStorage.setItem('quickVoterEntry', JSON.stringify(voterData));
    setSavedVoterEntry(voterData);
    alert('Quick voter entry saved. Use this to activate voters faster next time.');
  };

  const handleClearQuickVoter = () => {
    localStorage.removeItem('quickVoterEntry');
    setSavedVoterEntry(null);
  };

  const handleLoginSuccess = async (userData) => {
    const voterKey = getVoterKey(userData);
    const activeUser = { ...userData, voterKey };
    const sessionRef = doc(db, 'voting', 'session');
    const votesRef = doc(db, 'voting', 'votes');

    try {
      await runTransaction(db, async (transaction) => {
        const [sessionSnap, votesSnap] = await Promise.all([
          transaction.get(sessionRef),
          transaction.get(votesRef)
        ]);

        const existingVotes = votesSnap.exists() ? votesSnap.data().votes || [] : [];
        const currentSession = sessionSnap.exists() ? sessionSnap.data() : { status: 'idle' };

        if (existingVotes.some((vote) => vote.voterKey === voterKey)) {
          throw new Error('VOTER_ALREADY_VOTED');
        }

        if (
          currentSession.status === 'voting' &&
          currentSession.activeUser?.voterKey &&
          currentSession.activeUser.voterKey !== voterKey
        ) {
          throw new Error('SESSION_BUSY');
        }

        transaction.set(sessionRef, {
          status: 'voting',
          activeUser,
          ownerDeviceId: deviceId,
          startedAt: new Date().toISOString()
        });
      });

      setUser(activeUser);
      setUserType(userData.type);
      setScreen('voting');
    } catch (error) {
      console.error('Error activating ballot session:', error);
      if (error.message === 'VOTER_ALREADY_VOTED') {
        alert('This voter has already voted. Please activate the next voter.');
      } else if (error.message === 'SESSION_BUSY') {
        alert('Another voter session is already active. Please clear that session before activating a new voter.');
      } else {
        alert('Could not activate voter. Please try again.');
      }
    }
  };

  const handleVote = async (voteData) => {
    const voteItems = Array.isArray(voteData) ? voteData : [voteData];
    const voterKey = voteItems[0]?.voterKey;

    if (!voterKey) {
      alert('Vote could not be saved. Missing voter identity.');
      return false;
    }

    try {
      const votesRef = doc(db, 'voting', 'votes');
      const sessionRef = doc(db, 'voting', 'session');

      const newVotes = await runTransaction(db, async (transaction) => {
        const [votesSnap, sessionSnap] = await Promise.all([
          transaction.get(votesRef),
          transaction.get(sessionRef)
        ]);

        const existingVotes = votesSnap.exists() ? votesSnap.data().votes || [] : [];
        const currentSession = sessionSnap.exists() ? sessionSnap.data() : { status: 'idle' };

        if (existingVotes.some((vote) => vote.voterKey === voterKey)) {
          throw new Error('VOTER_ALREADY_VOTED');
        }

        if (
          currentSession.status === 'voting' &&
          currentSession.activeUser?.voterKey !== voterKey
        ) {
          throw new Error('SESSION_MISMATCH');
        }

        const nextVotes = [...existingVotes, ...voteItems];
        transaction.set(votesRef, { votes: nextVotes });
        transaction.set(sessionRef, { status: 'idle' });
        return nextVotes;
      });

      setVotes(newVotes);
      return true;
    } catch (error) {
      console.error('Error saving vote:', error);
      if (error.message === 'VOTER_ALREADY_VOTED') {
        alert('This voter has already voted. Vote was not changed.');
      } else if (error.message === 'SESSION_MISMATCH') {
        alert('The active session does not match this voter. Please reactivate the voter.');
      } else {
        alert('Vote could not be saved. Please ask the polling officer to try again.');
      }
      return false;
    }
  };

  const handleAdminClick = () => {
    setScreen("adminLogin");
  };

  const handleAdminLoginSuccess = (name) => {
    setAdminName(name);
    setScreen("adminPanel");
  };

  const handleUpdateCandidates = async (newCandidates) => {
    setCandidates(newCandidates);
    // Save to Firestore
    try {
      await setDoc(doc(db, 'voting', 'candidates'), { candidates: newCandidates });
    } catch (error) {
      console.error('Error saving candidates:', error);
    }
  };

  const handleLogout = () => {
    setAdminName(null);
    setScreen("home");
  };

  const handleResetElection = async () => {
    const confirmed = window.confirm(
      'Reset all voters now? This clears every saved vote and unlocks voters so they can vote again.'
    );

    if (!confirmed) {
      return false;
    }

    try {
      const emptyVotes = [];
      setVotes(emptyVotes);
      await setDoc(doc(db, 'voting', 'votes'), { votes: emptyVotes });
      await setDoc(doc(db, 'voting', 'session'), { status: 'idle' });
      setSession({ status: 'idle' });
      setUser(null);
      setUserType(null);
      alert('All voters reset: saved votes cleared and voting is ready again.');
      return true;
    } catch (error) {
      console.error('Error resetting election:', error);
      alert('Failed to reset voters. Check console for details.');
      return false;
    }
  };

  const handleBackToAdmin = () => {
    setScreen("adminPanel");
  };

  const handleGoToDashboard = () => {
    setScreen("adminDashboard");
  };

  const handleBackHome = async () => {
    if (session?.activeUser?.voterKey === user?.voterKey) {
      try {
        await setDoc(doc(db, 'voting', 'session'), { status: 'idle' });
      } catch (error) {
        console.error('Error clearing ballot session:', error);
      }
    }

    setUser(null);
    setUserType(null);
    setScreen("home");
  };

  const handleClearActiveSession = async () => {
    try {
      await setDoc(doc(db, 'voting', 'session'), { status: 'idle' });
      setSession({ status: 'idle' });
      setUser(null);
      setUserType(null);
      setScreen('home');
    } catch (error) {
      console.error('Error clearing active session:', error);
      alert('Could not clear active session. Please try from Admin Panel.');
    }
  };

  return (
    <div className="app-wrapper">
      {/* HOME SCREEN */}
      {screen === "home" && (
        <Home
          sessionActive={session?.status === 'voting'}
          sessionUser={session?.activeUser}
          onOpenBallot={() => setScreen('voting')}
          onStartVoting={handleStartVoting}
          onClearActiveSession={handleClearActiveSession}
          onAdminClick={handleAdminClick}
        />
      )}

      {/* STUDENT/TEACHER LOGIN */}
      {screen === "login" && (
        <StudentLogin 
          userType={userType}
          onLoginSuccess={handleLoginSuccess}
          onSaveQuickVoter={handleSaveQuickVoter}
          onClearQuickVoter={handleClearQuickVoter}
          savedVoterEntry={savedVoterEntry}
          onBack={handleBackHome}
        />
      )}

      {/* VOTING SCREEN */}
      {screen === "voting" && user && (
        <StudentVote 
          candidates={candidates}
          studentGrade={user.grade}
          studentGroup={user.group}
          studentName={user.name}
          voterId={user.voterId}
          voterKey={user.voterKey}
          onVote={handleVote}
          onBack={handleBackHome}
          canVoteForAll={userType === 'teacher'}
          showBackButton={true}
        />
      )}

      {/* ADMIN LOGIN */}
      {screen === "adminLogin" && (
        <AdminLogin 
          onAdminSuccess={handleAdminLoginSuccess}
          onBack={handleBackHome}
          correctPin="1234"
        />
      )}

      {/* ADMIN PANEL */}
      {screen === "adminPanel" && adminName && (
        <AdminPanel 
          candidates={candidates}
          onUpdateCandidates={handleUpdateCandidates}
          onGoToDashboard={handleGoToDashboard}
          onResetElection={handleResetElection}
          onLogout={handleLogout}
          onBack={() => setScreen('adminLogin')}
        />
      )}

      {/* ADMIN DASHBOARD */}
      {screen === "adminDashboard" && adminName && (
        <AdminDashboard 
          candidates={candidates}
          votes={votes}
          onBack={handleBackToAdmin}
          onResetElection={handleResetElection}
        />
      )}
    </div>
  );
}

export default App;
