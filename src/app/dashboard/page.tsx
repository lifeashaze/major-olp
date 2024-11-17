'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Plus, UserPlus, Book, Users, Bell, UserCog, ArrowRight, Info, LogOut, FileText } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { OnboardingDialog } from '@/components/OnboardingDialog'
import ReactConfetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { motion, AnimatePresence } from 'framer-motion' // npm install framer-motion
import { ClassInvitationCard } from '@/components/ClassInvitationCard'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { NotificationDropdown } from '@/components/NotificationDropdown'
import { Clock, GraduationCap, CheckCircle2 } from 'lucide-react'


interface Classroom {
  id: number
  name: string
  code: string
  year: string
  division: string
  courseCode: string
  courseName: string
  pendingAssignments: number
  creator?: {
    firstName: string
    lastName: string
  }
}

interface UserDetails {
  rollNo: string | null
  srn: string | null
  prn: string | null
  year: string | null
  division: string | null
}

interface ClassInvitation {
  id: string
  courseName: string
  courseCode: string
  year: string
  division: string
  professor: {
    firstName: string
    lastName: string
  }
  memberCount: number
}

interface Activity {
  id: string
  type: 'attendance' | 'submission' | 'grade'
  title: string
  date: Date
  details: {
    grade?: number
    maxGrade?: number
    classroomName?: string
    status?: 'present' | 'absent'
    submissionStatus?: 'on_time' | 'late'
  }
}

interface NavigationState {
  [key: number]: boolean;
}

const yearAbbreviations: { [key: string]: string } = {
  'First Year': 'FY',
  'Second Year': 'SY',
  'Third Year': 'TY',
  'Fourth Year': 'LY'  // LY for Last Year
};

const getYearDivisionDisplay = (year: string, division: string) => {
  const yearAbbr = yearAbbreviations[year] || year;
  return `${yearAbbr}-${division}`;
};

// Add User interface
interface User {
  id: string;
  firstName: string;
  email: string;
  role: "STUDENT" | "PROFESSOR" | "ADMIN";
}

const DashboardPage = () => {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [year, setYear] = useState<string>('');
  const [division, setDivision] = useState<string>('');
  const [courseCode, setCourseCode] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    rollNo: '',
    srn: '',
    prn: '',
    year: '',
    division: ''
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { width, height } = useWindowSize();
  const [navigatingStates, setNavigatingStates] = useState<NavigationState>({});
  const [classInvitations, setClassInvitations] = useState<ClassInvitation[]>([]);
  const [classroomToLeave, setClassroomToLeave] = useState<number | null>(null);
  const [classroomToDelete, setClassroomToDelete] = useState<number | null>(null);
  const [showFinalDeleteConfirm, setShowFinalDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  // Add dbUser state
  const [dbUser, setDbUser] = useState<User | null>(null);

  // Add fetchUserData function
  const fetchUserData = useCallback(async () => {
    try {
      const response = await axios.get('/api/user');
      console.log('User data from DB:', response.data);
      setDbUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  }, []);

  // Add useEffect for fetching user data
  useEffect(() => {
    if (isLoaded && user) {
      fetchUserData();
    }
  }, [isLoaded, user, fetchUserData]);

  // Replace isProfessor check with dbUser check
  const isProfessor = dbUser?.role === 'PROFESSOR';

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const [classroomsResponse, userDetailsResponse, invitationsResponse, activitiesResponse] = await Promise.all([
          axios.get('/api/classrooms'),
          axios.get('/api/user'),
          axios.get('/api/classrooms/invitations'),
          axios.get('/api/activities')
        ]);

        // Set classrooms
        setClassrooms(classroomsResponse.data.classrooms || []);

        // Check user details
        const details = userDetailsResponse.data;
        if (details.rollNo === null || details.srn === null || details.prn === null) {
          setShowOnboarding(true);
          setUserDetails(details);
        }

        // Set invitations
        setClassInvitations(invitationsResponse.data.invitations || []);

        // Set real activities
        setRecentActivities(activitiesResponse.data.activities || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Unable to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  useEffect(() => {
    // Prefetch classroom routes
    classrooms.forEach((classroom) => {
      router.prefetch(`/classroom/${classroom.id}`);
    });
  }, [classrooms, router]);

  const handleOnboardingSubmit = async () => {
    try {
      await axios.put('/api/user', userDetails);
      setShowCelebration(true);
      setShowOnboarding(false);
      
      
      setTimeout(() => {
        setShowCelebration(false);
      }, 3250);
    } catch (error) {
      console.error('Error updating user details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile details.",
      });
    }
  };

  if (!isLoaded || !dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Skeleton className="h-12 w-64" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-600 dark:text-gray-300">
          Please sign in to access the dashboard.
        </div>
      </div>
    );
  }

  // Add this before the loading check
  if (showOnboarding) {
    return (
      <OnboardingDialog
        showOnboarding={showOnboarding}
        setShowOnboarding={setShowOnboarding}
        userDetails={userDetails}
        setUserDetails={setUserDetails}
        onSubmit={handleOnboardingSubmit}
        user={{
          firstName: user?.firstName || '',
          lastName: user?.lastName || ''
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <main>
          <div className="container max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {/* Header Section */}
              <div className="flex justify-between items-center mb-8">
                <Skeleton className="h-12 w-64" /> {/* Greeting */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-md" /> {/* Profile button */}
                  <Skeleton className="h-10 w-10 rounded-md" /> {/* Notifications button */}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mb-6">
                <Skeleton className="h-10 w-36" /> {/* Create Classroom button */}
                <Skeleton className="h-10 w-36" /> {/* Join Classroom button */}
              </div>

              {/* Class Invitations Section */}
              <div className="mb-6">
                <Skeleton className="h-8 w-48 mb-3" /> {/* Section title */}
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-white">
                      <div className="flex-1">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Recent Activity
                  </h2>
                  <Badge variant="secondary" className="rounded-full">
                    {recentActivities.length}
                  </Badge>
                </div>

                {recentActivities.length === 0 ? (
                  <Card className="p-3 text-center">
                    <Clock className="h-8 w-8 mx-auto text-gray-400 mb-1.5" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">
                      No recent activity
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Your recent classroom activities will appear here
                    </p>
                  </Card>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary/50 to-transparent" />
                    
                    <div className="space-y-2">
                      {recentActivities
                        .slice(0, 5)
                        .map((activity, index) => (
                        <div key={activity.id} className="relative">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="ml-10 relative"
                          >
                            <Card className="overflow-hidden">
                              <div className={`absolute top-0 left-0 w-full h-0.5 ${
                                activity.type === 'attendance' 
                                  ? 'bg-blue-500' 
                                  : activity.type === 'submission'
                                  ? 'bg-purple-500'
                                  : 'bg-green-500'
                              }`} />
                              
                              <div className="p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-0.5">
                                        {activity.title}
                                      </p>
                                      {activity.details.classroomName && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          {activity.details.classroomName}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {activity.type === 'grade' && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                          {activity.details.grade}/{activity.details.maxGrade}
                                        </Badge>
                                      )}
                                      {activity.type === 'submission' && (
                                        <Badge 
                                          variant={activity.details.submissionStatus === 'on_time' ? 'secondary' : 'destructive'} 
                                          className="text-[10px] px-1.5 py-0.5"
                                        >
                                          {activity.details.submissionStatus === 'on_time' ? 'On Time' : 'Late'}
                                        </Badge>
                                      )}
                                      {activity.type === 'attendance' && (
                                        <Badge 
                                          variant={activity.details.status === 'present' ? 'secondary' : 'destructive'} 
                                          className="text-[10px] px-1.5 py-0.5"
                                        >
                                          {activity.details.status === 'present' ? 'Present' : 'Absent'}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </motion.div>

                          <div className="absolute left-2.5 top-3">
                            <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                              activity.type === 'attendance' 
                                ? 'bg-blue-500' 
                                : activity.type === 'submission'
                                ? 'bg-purple-500'
                                : 'bg-green-500'
                            }`}>
                              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Classrooms Section Header */}
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-8 w-48" /> {/* Section title */}
                <Skeleton className="h-10 w-64" /> {/* Search input */}
              </div>

              {/* Classrooms Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border rounded-lg p-6 bg-white">
                    <div className="flex justify-between items-start gap-4 mb-6">
                      <div className="flex-1">
                        <Skeleton className="h-7 w-3/4 mb-3" /> {/* Course name */}
                        <div className="flex gap-2 mb-3">
                          <Skeleton className="h-5 w-20" /> {/* Badge */}
                          <Skeleton className="h-5 w-20" /> {/* Badge */}
                          <Skeleton className="h-5 w-20" /> {/* Badge */}
                        </div>
                      </div>
                      <div className="bg-muted/30 p-3.5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-11 w-11 rounded-full" />
                          <div className="flex flex-col gap-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex flex-col gap-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-6 w-16" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 flex-1" /> {/* Enter button */}
                        <Skeleton className="h-12 w-12" /> {/* Delete button */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  const createClassroom = async () => {
    if (!courseName.trim() || !year || !division.trim() || !courseCode.trim()) {
      setCreateError("All fields are required")
      return
    }
    setCreateError(null)
    setIsCreating(true)
    try {
      const res = await axios.post('/api/classrooms/create', { 
        name: courseName, 
        year, 
        division, 
        courseCode,
        courseName 
      }, {
        headers: { 'Content-Type': 'application/json' },
      })
      
      const classroom = res.data
      
      toast({
        variant: "default",
        title: "Success",
        description: `Classroom "${classroom.courseName}" created successfully`,
      })
      
      setClassrooms([...classrooms, classroom])
      setCourseName('')
      setYear('')
      setDivision('')
      setCourseCode('')
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create classroom",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const joinClassroom = async () => {
    if (!joinCode.trim()) {
      setJoinError("Join code cannot be empty")
      return
    }
    setJoinError(null)
    setIsJoining(true)
    try {
      const res = await axios.post('/api/classrooms/join', { code: joinCode }, {
        headers: { 'Content-Type': 'application/json' },
      })
      
      const { message, classroom } = res.data
      
      if (classroom && classroom.courseName) {
        if (message === 'You are already a member of this classroom') {
          toast({
            variant: "default",
            title: "Info",
            description: message,
          })
        } else {
          toast({
            variant: "default",
            title: "Success",
            description: `Joined classroom "${classroom.courseName}" successfully`,
          })
          
          // Fetch updated classroom list
          const updatedClassrooms = await fetchClassrooms()
          setClassrooms(updatedClassrooms)
        }
        
        setJoinCode('')
        setIsJoinDialogOpen(false)
      } else {
        throw new Error('Invalid classroom data received')
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join classroom",
      })
    } finally {
      setIsJoining(false)
    }
  }

  // Add this function to fetch classrooms
  const fetchClassrooms = async () => {
    try {
      const response = await axios.get('/api/classrooms', {
        params: {
          includeCounts: true 
        }
      })
      return response.data.classrooms
    } catch (error) {
      console.error('Failed to fetch classrooms:', error)
      return []
    }
  }

  const handleDeleteClassroom = async () => {
    if (!classroomToDelete) return;
    
    try {
      await axios.delete(`/api/classrooms/${classroomToDelete}`);
      setClassrooms(classrooms.filter(classroom => classroom.id !== classroomToDelete));
      toast({
        variant: "default",
        title: "Success",
        description: "Classroom deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete classroom:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete classroom",
      });
    } finally {
      setClassroomToDelete(null);
      setShowFinalDeleteConfirm(false);
      setDeleteConfirmText('');  // Clear the confirmation text
    }
  };

  const filteredClassrooms = classrooms.filter(classroom =>
    (classroom.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (classroom.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (classroom.division?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const handleClassroomNavigation = (classroomId: number) => {
    setNavigatingStates(prev => ({ ...prev, [classroomId]: true }));
    router.push(`/classroom/${classroomId}`);
  };

  const handleAcceptInvitation = async (id: string) => {
    try {
      setIsJoining(true);
      const response = await axios.post('/api/classrooms/join', { id });
      
      // Remove the invitation from the list
      setClassInvitations(prev => prev.filter(invite => invite.id !== id));
      
      // Add the new classroom to the list
      const updatedClassrooms = await fetchClassrooms();
      setClassrooms(updatedClassrooms);

      toast({
        title: "Success",
        description: "Successfully joined the classroom",
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join classroom",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleDismissInvitation = (id: string | number) => {
    // Simply remove from local state
    setClassInvitations(prev => prev.filter(invite => invite.id !== id));
    toast({
      title: "Success",
      description: "Invitation dismissed",
    });
  };

  const handleLeaveClassroom = async (classroomId: number) => {
    try {
      await axios.post(`/api/classrooms/${classroomId}/leave`);
      
      // Remove the classroom from the list
      setClassrooms(prev => prev.filter(c => c.id !== classroomId));
      
      toast({
        title: "Success",
        description: "Successfully left the classroom",
      });
    } catch (error: any) {
      console.error('Error leaving classroom:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to leave classroom",
      });
    }
  };

  return (
    <>
      <AnimatePresence>
        {showCelebration && (
          <>
            <ReactConfetti
              width={width}
              height={height}
              recycle={false}
              numberOfPieces={500}
              gravity={0.2}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-xl text-center">
                <motion.h1 
                  className="text-4xl font-bold mb-4"
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  Welcome to Athenium! 🎓
                </motion.h1>
                <motion.div 
                  className="flex justify-center space-x-4 mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {["", "📚", "✨", "", "🎓"].map((emoji, i) => (
                    <motion.span
                      key={i}
                      className="text-3xl"
                      animate={{ 
                        y: [0, -10, 0],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.1
                      }}
                    >
                      {emoji}
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="py-8">
          <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Section - Redesigned */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
              <div>
                <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
                  {(() => {
                    const hour = new Date().getHours()
                    if (hour >= 5 && hour < 12) return "Good Morning"
                    if (hour >= 12 && hour < 18) return "Good Afternoon"
                    return "Good Evening"
                  })()},
                  <span className="font-semibold ml-1">{user?.firstName}</span>
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Test data inserted for demonstration purposes
                </p>
              </div>
              <div className="flex items-center gap-3">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setShowOnboarding(true)}
                        className="h-9 w-9"
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Update Profile</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <NotificationDropdown userId={user?.id} />
              </div>
            </div>

            {/* Action Bar - Modified for role-based access */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search classrooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-[300px] h-9"
                />
              </div>
              <div className="flex items-center gap-3">
                <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Join
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Join Classroom</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Input
                        type="text"
                        value={joinCode}
                        onChange={(e) => {
                          setJoinCode(e.target.value)
                          setJoinError(null)
                        }}
                        placeholder="Classroom Code"
                      />
                      {joinError && (
                        <Alert variant="destructive">
                          <AlertDescription>{joinError}</AlertDescription>
                        </Alert>
                      )}
                      <Button 
                        onClick={joinClassroom} 
                        className="w-full"
                        disabled={isJoining}
                      >
                        {isJoining ? 'Joining...' : 'Join Classroom'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {isProfessor && (
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-9">
                        <Plus className="mr-2 h-4 w-4" />
                        Create
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Classroom</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <Select onValueChange={setYear} value={year}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(yearAbbreviations).map((yearOption) => (
                              <SelectItem key={yearOption} value={yearOption}>
                                {yearOption}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select onValueChange={setDivision} value={division}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Division" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter) => (
                              <SelectItem key={letter} value={letter}>
                                {letter}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="text"
                          value={courseCode}
                          onChange={(e) => setCourseCode(e.target.value)}
                          placeholder="Course Code"
                        />
                        <Input
                          type="text"
                          value={courseName}
                          onChange={(e) => setCourseName(e.target.value)}
                          placeholder="Course Name"
                        />
                        {createError && (
                          <Alert variant="destructive">
                            <AlertDescription>{createError}</AlertDescription>
                          </Alert>
                        )}
                        <Button 
                          onClick={createClassroom} 
                          className="w-full"
                          disabled={isCreating}
                        >
                          {isCreating ? 'Creating...' : 'Create Classroom'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Class Invitations Section - Redesigned */}
            {classInvitations.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Pending Invitations
                  </h2>
                  <Badge variant="secondary" className="rounded-full">
                    {classInvitations.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {classInvitations.map((invitation) => (
                    <ClassInvitationCard
                      key={invitation.id}
                      {...invitation}
                      onAccept={handleAcceptInvitation}
                      onDismiss={handleDismissInvitation}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Classrooms Section - Should come first */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Your Classrooms
                </h2>
                <Badge variant="secondary" className="rounded-full">
                  {filteredClassrooms.length}
                </Badge>
              </div>
              
              {filteredClassrooms.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                  <Book className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    No classrooms found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create or join a classroom to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredClassrooms.map((classroom) => (
                    <Card 
                      key={classroom.id} 
                      className="group hover:shadow-md transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800"
                    >
                      <div className="relative p-4">
                        {/* Top Section */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">
                                {classroom.courseCode}
                              </span>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                              {classroom.courseName}
                            </h3>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="text-[10px] px-1.5 py-0 h-5"
                          >
                            {getYearDivisionDisplay(classroom.year, classroom.division)}
                          </Badge>
                        </div>

                        {/* Professor & Assignment Info */}
                        <div className="flex items-center justify-between mb-3 p-2.5 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserCog className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Professor</p>
                              <p className="text-sm font-medium truncate">
                                {classroom.creator?.firstName} {classroom.creator?.lastName}
                              </p>
                            </div>
                          </div>
                          <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            classroom.pendingAssignments > 0 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {classroom.pendingAssignments} Due
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="default" 
                            onClick={() => handleClassroomNavigation(classroom.id)}
                            className="flex-1 h-9 text-sm bg-primary hover:bg-primary/90"
                            disabled={navigatingStates[classroom.id]}
                          >
                            {navigatingStates[classroom.id] ? (
                              <span className="flex items-center justify-center gap-1.5">
                                <span className="animate-spin">⏳</span>
                                Loading...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-1.5">
                                Enter
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                              </span>
                            )}
                          </Button>
                          <TooltipProvider delayDuration={0}>
                            <div className="flex gap-1">
                              {!isProfessor && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setClassroomToLeave(classroom.id)}
                                      className="h-9 w-9 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <LogOut className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">Leave Classroom</TooltipContent>
                                </Tooltip>
                              )}
                              {isProfessor && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setClassroomToDelete(classroom.id)}
                                      className="h-9 w-9 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">Delete Classroom</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TooltipProvider>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Section with two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Recent Activity Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Recent Activity
                  </h2>
                </div>

                {recentActivities.length === 0 ? (
                  <Card className="p-3 text-center">
                    <Clock className="h-8 w-8 mx-auto text-gray-400 mb-1.5" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">
                      No recent activity
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Your recent classroom activities will appear here
                    </p>
                  </Card>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary/50 to-transparent" />
                    
                    <div className="space-y-2">
                      {recentActivities
                        .slice(0, 5)
                        .map((activity, index) => (
                        <div key={activity.id} className="relative">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="ml-10 relative"
                          >
                            <Card className="overflow-hidden">
                              <div className={`absolute top-0 left-0 w-full h-0.5 ${
                                activity.type === 'attendance' 
                                  ? 'bg-blue-500' 
                                  : activity.type === 'submission'
                                  ? 'bg-purple-500'
                                  : 'bg-green-500'
                              }`} />
                              
                              <div className="p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-0.5">
                                        {activity.title}
                                      </p>
                                      {activity.details.classroomName && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          {activity.details.classroomName}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {activity.type === 'grade' && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                          {activity.details.grade}/{activity.details.maxGrade}
                                        </Badge>
                                      )}
                                      {activity.type === 'submission' && (
                                        <Badge 
                                          variant={activity.details.submissionStatus === 'on_time' ? 'secondary' : 'destructive'} 
                                          className="text-[10px] px-1.5 py-0.5"
                                        >
                                          {activity.details.submissionStatus === 'on_time' ? 'On Time' : 'Late'}
                                        </Badge>
                                      )}
                                      {activity.type === 'attendance' && (
                                        <Badge 
                                          variant={activity.details.status === 'present' ? 'secondary' : 'destructive'} 
                                          className="text-[10px] px-1.5 py-0.5"
                                        >
                                          {activity.details.status === 'present' ? 'Present' : 'Absent'}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </motion.div>

                          <div className="absolute left-2.5 top-3">
                            <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                              activity.type === 'attendance' 
                                ? 'bg-blue-500' 
                                : activity.type === 'submission'
                                ? 'bg-purple-500'
                                : 'bg-green-500'
                            }`}>
                              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Overview Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Activity Overview
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Classrooms Card */}
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-lg">
                        <Book className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Active Classes
                        </p>
                        <p className="text-2xl font-semibold mt-1">
                          {classrooms.length}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Submissions Card */}
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-lg">
                        <FileText className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Submissions
                        </p>
                        <p className="text-2xl font-semibold mt-1">
                          {recentActivities.filter(a => a.type === 'submission').length}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Grades Card */}
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-lg">
                        <GraduationCap className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Grades
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-semibold mt-1">
                            {recentActivities.filter(a => a.type === 'grade').length}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {Math.round(recentActivities
                              .filter(a => a.type === 'grade')
                              .reduce((acc, curr) => acc + (curr.details.grade! / curr.details.maxGrade!) * 100, 0) / 
                              recentActivities.filter(a => a.type === 'grade').length || 0
                            )}% avg
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Attendance Card */}
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-lg">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Attendance
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-semibold mt-1">
                            {recentActivities.filter(a => a.type === 'attendance').length}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {Math.round(recentActivities
                              .filter(a => a.type === 'attendance')
                              .filter(a => a.details.status === 'present').length / 
                              recentActivities.filter(a => a.type === 'attendance').length * 100 || 0
                            )}% present
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Pending Assignments Card */}
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-lg">
                        <Clock className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Pending Work
                        </p>
                        <p className="text-2xl font-semibold mt-1">
                          {classrooms.reduce((acc, curr) => acc + (curr.pendingAssignments || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Class Invitations Card */}
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-rose-100 dark:bg-rose-900/30 p-2.5 rounded-lg">
                        <UserPlus className="h-5 w-5 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Invitations
                        </p>
                        <p className="text-2xl font-semibold mt-1">
                          {classInvitations.length}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={classroomToLeave !== null} onOpenChange={() => setClassroomToLeave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Classroom</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to leave this classroom? You'll need a new invitation to rejoin.</p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setClassroomToLeave(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (classroomToLeave) {
                  handleLeaveClassroom(classroomToLeave);
                  setClassroomToLeave(null);
                }
              }}
            >
              Leave Classroom
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={classroomToDelete !== null} onOpenChange={() => setClassroomToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Classroom</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-200 rounded-lg">
              <Info className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">This action will permanently delete the classroom and all its data.</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this classroom? This will remove all assignments, submissions, and student data.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setClassroomToDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setShowFinalDeleteConfirm(true)}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFinalDeleteConfirm} onOpenChange={setShowFinalDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">
              Are you absolutely sure?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="font-semibold">
              This action cannot be undone. This will permanently delete the classroom and all associated data.
            </p>
            <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                Please type <span className="font-mono font-bold">
                  {classrooms.find(c => c.id === classroomToDelete)?.courseName}
                </span> to confirm.
              </p>
              <Input 
                className="mt-2"
                placeholder="Type the course name to confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => {
              setShowFinalDeleteConfirm(false);
              setClassroomToDelete(null);
              setDeleteConfirmText('');  // Clear the input when canceling
            }}>
              Cancel
            </Button>
            <Button 
              id="final-delete-button"
              variant="destructive" 
              onClick={handleDeleteClassroom}
              disabled={deleteConfirmText.toLowerCase() !== (classrooms.find(c => c.id === classroomToDelete)?.courseName || '').toLowerCase()}
            >
              Delete Classroom
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DashboardPage
