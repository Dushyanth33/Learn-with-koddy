import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import AuthCard from './components/AuthCard';
import Chatbot from './components/Chatbot';
import { CoursesView, MyLearningView, ProfileView } from './components/Views';
import CourseDetail from './components/CourseDetail';
import CoursePlayer from './components/CoursePlayer';
import type { Course } from './data/courses';

export interface User {
  name: string;
  email: string;
}

function App() {
  const [currentView, setCurrentView] = useState('Home');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('koddy_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [enrolledCourses, setEnrolledCourses] = useState<string[]>(() => {
    const saved = localStorage.getItem('koddy_enrolled');
    return saved ? JSON.parse(saved) : [];
  });

  const handleSelectCourse = (course: Course) => {
    setActiveCourse(course);
    setCurrentView('CourseDetail');
  };

  const handleEnroll = () => {
    if (!user) {
      setCurrentView('Login');
      return;
    }
    if (activeCourse && !enrolledCourses.includes(activeCourse.id)) {
      const updated = [...enrolledCourses, activeCourse.id];
      setEnrolledCourses(updated);
      localStorage.setItem('koddy_enrolled', JSON.stringify(updated));
    }
    setCurrentView('Player');
  };

  const handleAuth = (authUser: User) => {
    setUser(authUser);
    localStorage.setItem('koddy_user', JSON.stringify(authUser));
    setCurrentView('Home');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('koddy_user');
    setCurrentView('Home');
  };

  const isFullScreenView = currentView === 'Player' || currentView === 'Login' || currentView === 'SignUp';

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary-500/30">
      
      {/* Show Navbar on all views except Fullscreen Views */}
      {!isFullScreenView && (
        <Navbar 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          user={user}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Area */}
      <main>
        {currentView === 'Home' && (
          <div className="animate-in fade-in duration-500">
            <Hero setCurrentView={setCurrentView} isLoggedIn={!!user} />
            <Features />
          </div>
        )}

        {currentView === 'Courses' && (
          <div className="animate-in fade-in duration-500">
            <CoursesView enrolledCourses={enrolledCourses} onSelectCourse={handleSelectCourse} />
          </div>
        )}

        {currentView === 'My Learning' && (
          <div className="animate-in fade-in duration-500">
            <MyLearningView enrolledCourses={enrolledCourses} onSelectCourse={(c) => { setActiveCourse(c); setCurrentView('Player'); }} />
          </div>
        )}

        {currentView === 'Profile' && (
          <div className="animate-in fade-in duration-500">
            <ProfileView user={user} enrolledCount={enrolledCourses.length} />
          </div>
        )}

        {currentView === 'CourseDetail' && activeCourse && (
          <div className="animate-in fade-in duration-500">
            <CourseDetail 
              course={activeCourse} 
              isEnrolled={enrolledCourses.includes(activeCourse.id)}
              onEnroll={handleEnroll}
              onBack={() => setCurrentView('Courses')}
            />
          </div>
        )}

        {currentView === 'Player' && activeCourse && (
          <div className="animate-in fade-in duration-500">
            <CoursePlayer 
              course={activeCourse} 
              onBack={() => setCurrentView('My Learning')} 
            />
          </div>
        )}

        {(currentView === 'Login' || currentView === 'SignUp') && (
          <div className="animate-in fade-in duration-500 z-50 relative">
            <AuthCard 
              type={currentView as 'Login' | 'SignUp'} 
              setCurrentView={setCurrentView} 
              onAuth={handleAuth}
            />
          </div>
        )}
      </main>

      {/* Global Chatbot */}
      {!isFullScreenView && (
         <Chatbot />
      )}

    </div>
  );
}

export default App;
