import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Image,
  Modal, ScrollView, Animated
} from 'react-native';
import { Send, Menu, Heart, Activity, Calendar, Mic, ArrowLeft, X, User, Droplet, Plus, CheckCircle, Circle, Trash2, Navigation, Flame, RefreshCcw, Volume2, VolumeX } from 'lucide-react-native';

// Color Palette
const COLORS = {
  bg: '#120E21',
  card: '#1E1938',
  accent: '#9D8DF1',
  textMain: '#FFFFFF',
  textSub: '#A5A5A5',
  userBubble: '#6C5CE7',
  online: '#4CAF50'
};

export default function App() {
  const introMessage = { id: '1', text: "Hello! I'm Ogoo. How can I help you today?", fromUser: false };
  const [messages, setMessages] = useState([introMessage]);
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [forceDashboard, setForceDashboard] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  // Slice / temporary backend state
  const [userInfo, setUserInfo] = useState<{ firstName?: string, lastName?: string, email?: string } | null>(null);
  
  // Device ID & Location mock/capture
  const deviceId = useRef(Math.random().toString(36).substring(2, 15)).current;
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

  React.useEffect(() => {
    if (Platform.OS === 'web' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      }, () => console.log('Location access denied or failed'));
    }
  }, []);

  const [activeModal, setActiveModal] = useState<'liquid' | 'plan' | 'vitals' | 'activity' | 'myplan' | null>(null);

  // Persistent Data States
  const [liquidLogs, setLiquidLogs] = useState<{ id: string, amount: number, time: number }[]>([]);
  const [planTasks, setPlanTasks] = useState<{ id: string, category: string, time: string, checked: boolean }[]>([]);
  const [vitalsHistory, setVitalsHistory] = useState<{ id: string, hr: number, bpSys: number, bpDia: number, spo2: number, temp: number, date: number }[]>([]);
  const [activityData, setActivityData] = useState({ steps: 0, activeMinutes: 0, calories: 0 });
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Load from local storage
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const storedLiquid = localStorage.getItem('ogoo_liquid');
        if (storedLiquid) setLiquidLogs(JSON.parse(storedLiquid));
        const storedPlan = localStorage.getItem('ogoo_plan');
        if (storedPlan) setPlanTasks(JSON.parse(storedPlan));
        const storedVitals = localStorage.getItem('ogoo_vitals');
        if (storedVitals) setVitalsHistory(JSON.parse(storedVitals));
        const storedActivity = localStorage.getItem('ogoo_activity');
        if (storedActivity) setActivityData(JSON.parse(storedActivity));
        const storedVoice = localStorage.getItem('ogoo_voice');
        if (storedVoice) setVoiceEnabled(JSON.parse(storedVoice));
      } catch (e) {
        console.error("Local storage load error", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (Platform.OS === 'web') localStorage.setItem('ogoo_liquid', JSON.stringify(liquidLogs));
  }, [liquidLogs]);
  useEffect(() => {
    if (Platform.OS === 'web') localStorage.setItem('ogoo_plan', JSON.stringify(planTasks));
  }, [planTasks]);
  useEffect(() => {
    if (Platform.OS === 'web') localStorage.setItem('ogoo_vitals', JSON.stringify(vitalsHistory));
  }, [vitalsHistory]);
  useEffect(() => {
    if (Platform.OS === 'web') localStorage.setItem('ogoo_activity', JSON.stringify(activityData));
  }, [activityData]);
  useEffect(() => {
    if (Platform.OS === 'web') localStorage.setItem('ogoo_voice', JSON.stringify(voiceEnabled));
  }, [voiceEnabled]);

  const speakText = (text: string) => {
    if (Platform.OS === 'web' && voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.pitch = 1.1;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };
  const showDashboard = forceDashboard !== null ? forceDashboard : (!isFocused && inputText.length === 0 && messages.length === 1);

  // START SPEECH RECOGNITION (Voice transcription)
  const startSpeechRecognition = () => {
    if (Platform.OS !== 'web') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Safari!");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
    };

    recognition.start();
  };

  const handleCardPress = async (actionText: string) => {
    setForceDashboard(false);
    await sendCustomMessage(actionText);
  };

  const sendCustomMessage = async (textToSend: string) => {
    if (isLoading) return;

    const userMsg = { id: Date.now().toString(), text: textToSend, fromUser: true };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const geminiMessages = newMessages.map(m => ({
        role: m.fromUser ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: geminiMessages,
          userInfo,
          location,
          deviceId
        }),
      });

      const data = await response.json();
      
      if (data.savedInfo) {
         setUserInfo(prev => ({ ...prev, ...data.savedInfo }));
      }

      const ogooMsg = { id: (Date.now() + 1).toString(), text: data.reply, fromUser: false };
      setMessages((prev) => [...prev, ogooMsg]);
      speakText(data.reply);
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: 'error',
        text: "I'm having trouble connecting to my brain. Check your internet?",
        fromUser: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (inputText.trim() === '' || isLoading) return;
    setForceDashboard(false);
    const currentInput = inputText;
    setInputText('');
    await sendCustomMessage(currentInput);
  };

  // RESTORED HEADER COMPONENT
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {!showDashboard && (
          <TouchableOpacity onPress={() => setForceDashboard(true)} style={{ marginRight: 12 }}>
            <ArrowLeft color={COLORS.textMain} size={24} />
          </TouchableOpacity>
        )}
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80' }}
          style={styles.avatarMini}
        />
        <View>
          <Text style={styles.headerTitle}>Ogoo</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuCircle}>
        <Menu color={COLORS.textMain} size={20} />
      </TouchableOpacity>
    </View>
  );

  const MenuOverlay = () => {
    if (!showMenu) return null;
    return (
      <View style={styles.menuOverlay}>
        <View style={styles.menuContent}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Profile & Settings</Text>
            <TouchableOpacity onPress={() => setShowMenu(false)} style={styles.closeButton}>
              <X color={COLORS.textMain} size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.userInfoCard}>
            <View style={styles.userIconCircle}>
              <User color="white" size={32} />
            </View>
            {userInfo && userInfo.firstName ? (
              <>
                <Text style={styles.userName}>{userInfo.firstName} {userInfo.lastName || ''}</Text>
                <Text style={styles.userEmail}>{userInfo.email || 'No email provided'}</Text>
              </>
            ) : (
              <Text style={styles.userName}>Guest User</Text>
            )}
            <View style={styles.deviceInfoBox}>
              <Text style={styles.deviceInfoText}>Device ID: {deviceId}</Text>
              {location && (
                <Text style={styles.deviceInfoText}>Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</Text>
              )}
            </View>
          </View>
          <View style={[styles.userInfoCard, {marginTop: 16}]}>
             <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                <Text style={{color: COLORS.textMain, fontSize: 16, fontWeight: '600'}}>Voice Output (Accessibility)</Text>
                <TouchableOpacity onPress={() => setVoiceEnabled(!voiceEnabled)}>
                   {voiceEnabled ? <Volume2 color={COLORS.online} size={24}/> : <VolumeX color={COLORS.textSub} size={24}/>}
                </TouchableOpacity>
             </View>
             <Text style={{color: COLORS.textSub, fontSize: 12, marginTop: 8}}>
               Enable to allow Ogoo to speak its responses aloud.
             </Text>
          </View>
        </View>
      </View>
    );
  };

  const LiquidModal = () => {
    const today = new Date().setHours(0,0,0,0);
    const todaysLogs = liquidLogs.filter(l => l.time >= today);
    const totalMl = todaysLogs.reduce((acc, curr) => acc + curr.amount, 0);
    const dailyGoal = 2500;
    const progress = Math.min(totalMl / dailyGoal, 1);

    const addLiquid = (amount: number) => {
      setLiquidLogs([{ id: Date.now().toString(), amount, time: Date.now() }, ...liquidLogs]);
    };
    const removeLiquid = (id: string) => {
      setLiquidLogs(liquidLogs.filter(l => l.id !== id));
    };

    return (
      <Modal visible={activeModal === 'liquid'} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hydration Tracker</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><X color="#FFF" size={24}/></TouchableOpacity>
            </View>
            
            <View style={styles.radialContainer}>
               <View style={styles.radialOuter}>
                  <View style={[styles.radialInner, { height: `${progress * 100}%` }]} />
                  <Text style={styles.radialText}>{totalMl} ml</Text>
                  <Text style={styles.radialSub}>/ {dailyGoal} ml</Text>
               </View>
            </View>

            <View style={styles.heroActionRow}>
               <TouchableOpacity onPress={() => addLiquid(250)} style={styles.heroButtonPrimary}>
                  <Droplet color="white" size={16} style={{marginRight:8}}/>
                  <Text style={styles.heroButtonText}>+250ml Glass</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => addLiquid(500)} style={styles.heroButtonSecondary}>
                  <Droplet color={COLORS.accent} size={16} style={{marginRight:8}}/>
                  <Text style={[styles.heroButtonText, {color: COLORS.accent}]}>+500ml Bottle</Text>
               </TouchableOpacity>
            </View>

            <Text style={[styles.cardHeader, { marginTop: 24, marginBottom: 12 }]}>Today's Log</Text>
            <ScrollView style={{maxHeight: 200}}>
               {todaysLogs.map(log => (
                 <View key={log.id} style={styles.logItem}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Droplet color={COLORS.accent} size={16} style={{marginRight:8}}/>
                      <Text style={{color: '#FFF', fontSize: 16}}>{log.amount} ml</Text>
                      <Text style={{color: COLORS.textSub, fontSize: 12, marginLeft: 8}}>{new Date(log.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeLiquid(log.id)}><Trash2 color="#FF4B4B" size={18}/></TouchableOpacity>
                 </View>
               ))}
               {todaysLogs.length === 0 && <Text style={{color: COLORS.textSub, textAlign:'center'}}>No liquids logged today.</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const PlanModal = () => {
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskCat, setNewTaskCat] = useState('💊 Medicine');

    const addTask = () => {
      if(!newTaskText.trim()) return;
      setPlanTasks([...planTasks, { id: Date.now().toString(), category: newTaskCat, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), checked: false }]);
      setNewTaskText('');
    };

    const toggleTask = (id: string) => {
      setPlanTasks(planTasks.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
    };

    const removeTask = (id: string) => {
      setPlanTasks(planTasks.filter(t => t.id !== id));
    };

    return (
      <Modal visible={activeModal === 'plan'} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dynamic Routine Planner</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><X color="#FFF" size={24}/></TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
               {['💊 Medicine', '🏃 Exercise', '💧 Hydration', '🍏 Diet', '📋 General'].map(cat => (
                 <TouchableOpacity key={cat} onPress={() => setNewTaskCat(cat)} style={[styles.catBadge, newTaskCat === cat && styles.catBadgeActive, {marginRight: 8}]}>
                    <Text style={[styles.catBadgeText, newTaskCat === cat && {color: '#FFF'}]}>{cat.split(' ')[0]}</Text>
                 </TouchableOpacity>
               ))}
            </ScrollView>

            <View style={[styles.inputWrapper, {marginBottom: 20}]}>
               <TextInput 
                  style={styles.input} 
                  placeholder={`Add task...`}
                  placeholderTextColor={COLORS.textSub}
                  value={newTaskText}
                  onChangeText={setNewTaskText}
                  onSubmitEditing={addTask}
               />
               <TouchableOpacity onPress={addTask} style={styles.sendButton}><Plus color="#FFF" size={18}/></TouchableOpacity>
            </View>

            <ScrollView style={{maxHeight: 300}}>
               {planTasks.map(task => (
                 <View key={task.id} style={styles.taskItem}>
                    <TouchableOpacity onPress={() => toggleTask(task.id)} style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                       {task.checked ? <CheckCircle color={COLORS.online} size={22}/> : <Circle color={COLORS.textSub} size={22}/>}
                       <View style={{marginLeft: 12}}>
                         <Text style={{color: task.checked ? COLORS.textSub : '#FFF', fontSize: 16, textDecorationLine: task.checked ? 'line-through' : 'none'}}>{task.category.split(' ')[0]} {task.category.split(' ')[1]}</Text>
                         <Text style={{color: COLORS.textSub, fontSize: 12}}>{task.time}</Text>
                       </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeTask(task.id)}><Trash2 color="#FF4B4B" size={18}/></TouchableOpacity>
                 </View>
               ))}
               {planTasks.length === 0 && <Text style={{color: COLORS.textSub, textAlign:'center'}}>No tasks scheduled.</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const VitalsModal = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanStage, setScanStage] = useState('');
    const scanAnim = useRef(new Animated.Value(0)).current;

    const startScan = () => {
      setIsScanning(true);
      setScanStage('Connecting to bio-sensors...');
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(scanAnim, { toValue: 0, duration: 800, useNativeDriver: false })
        ])
      ).start();

      setTimeout(() => setScanStage('Analyzing heart rhythm...'), 1500);
      setTimeout(() => setScanStage('Calculating SpO2...'), 3000);
      setTimeout(() => {
        setIsScanning(false);
        scanAnim.stopAnimation();
        
        const newReading = {
          id: Date.now().toString(),
          date: Date.now(),
          hr: Math.floor(Math.random() * (90 - 65 + 1) + 65),
          bpSys: Math.floor(Math.random() * (125 - 110 + 1) + 110),
          bpDia: Math.floor(Math.random() * (85 - 70 + 1) + 70),
          spo2: Math.floor(Math.random() * (100 - 95 + 1) + 95),
          temp: parseFloat((Math.random() * (99.1 - 97.5) + 97.5).toFixed(1))
        };
        setVitalsHistory([newReading, ...vitalsHistory]);
        speakText("Bio scan complete. Your vitals have been updated successfully.");
      }, 4500);
    };

    return (
      <Modal visible={activeModal === 'vitals'} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Diagnostic Bio-Sensor</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><X color="#FFF" size={24}/></TouchableOpacity>
            </View>

            <View style={{alignItems: 'center', marginVertical: 20}}>
               <Animated.View style={[styles.sensorCircle, { 
                   transform: [{ scale: scanAnim.interpolate({inputRange:[0,1], outputRange:[1, 1.2]}) }],
                   opacity: scanAnim.interpolate({inputRange:[0,1], outputRange:[1, 0.5]})
               }]}>
                  <Heart color={isScanning ? "#FF4B4B" : COLORS.accent} size={48} fill={isScanning ? "#FF4B4B" : "transparent"}/>
               </Animated.View>
               <Text style={{color: COLORS.textSub, marginTop: 24, fontSize: 16}}>{isScanning ? scanStage : "Place finger on sensor / Wearable ready"}</Text>
            </View>

            <TouchableOpacity onPress={startScan} disabled={isScanning} style={[styles.heroButtonPrimary, {marginBottom: 24, opacity: isScanning ? 0.5 : 1}]}>
               <Activity color="white" size={18} style={{marginRight:8}}/>
               <Text style={styles.heroButtonText}>{isScanning ? "Scanning..." : "Start Bio-Scan"}</Text>
            </TouchableOpacity>

            <Text style={[styles.cardHeader, { marginBottom: 12 }]}>Historic Scans</Text>
            <ScrollView style={{maxHeight: 200}}>
               {vitalsHistory.map(scan => (
                 <View key={scan.id} style={styles.vitalItem}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6}}>
                       <Text style={{color: '#FFF', fontWeight: 'bold'}}>{new Date(scan.date).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</Text>
                       <Text style={{color: COLORS.online, fontWeight: '600'}}>Optimal</Text>
                    </View>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                       <Text style={{color: COLORS.textSub}}>HR: <Text style={{color:'#FFF'}}>{scan.hr} bpm</Text></Text>
                       <Text style={{color: COLORS.textSub}}>BP: <Text style={{color:'#FFF'}}>{scan.bpSys}/{scan.bpDia}</Text></Text>
                       <Text style={{color: COLORS.textSub}}>SpO2: <Text style={{color:'#FFF'}}>{scan.spo2}%</Text></Text>
                    </View>
                 </View>
               ))}
               {vitalsHistory.length === 0 && <Text style={{color: COLORS.textSub, textAlign:'center', marginTop:20}}>No scans recorded yet.</Text>}
            </ScrollView>

          </View>
        </View>
      </Modal>
    );
  };

  const ActivityModal = () => {
    const addActivity = (type: 'walk' | 'run') => {
       const steps = type === 'walk' ? 1200 : 2500;
       const mins = type === 'walk' ? 15 : 20;
       const cals = type === 'walk' ? 60 : 150;
       setActivityData({
         steps: activityData.steps + steps,
         activeMinutes: activityData.activeMinutes + mins,
         calories: activityData.calories + cals
       });
       speakText(`Great job! You have logged a ${type}.`);
    };

    return (
      <Modal visible={activeModal === 'activity'} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Daily Activity</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><X color="#FFF" size={24}/></TouchableOpacity>
            </View>

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24}}>
               <View style={styles.statBox}>
                  <Navigation color={COLORS.accent} size={24} style={{marginBottom:8}}/>
                  <Text style={styles.statValue}>{activityData.steps}</Text>
                  <Text style={styles.statLabel}>Steps</Text>
               </View>
               <View style={styles.statBox}>
                  <Activity color={COLORS.online} size={24} style={{marginBottom:8}}/>
                  <Text style={styles.statValue}>{activityData.activeMinutes}</Text>
                  <Text style={styles.statLabel}>Active Mins</Text>
               </View>
               <View style={styles.statBox}>
                  <Flame color="#FF9800" size={24} style={{marginBottom:8}}/>
                  <Text style={styles.statValue}>{activityData.calories}</Text>
                  <Text style={styles.statLabel}>Calories</Text>
               </View>
            </View>

            <Text style={[styles.cardHeader, { marginBottom: 12 }]}>Physical Action Simulator</Text>
            <View style={{flexDirection: 'row', gap: 12}}>
               <TouchableOpacity onPress={() => addActivity('walk')} style={styles.heroButtonSecondary}>
                  <Text style={[styles.heroButtonText, {color: COLORS.accent}]}>+ Brisk Walk</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => addActivity('run')} style={styles.heroButtonPrimary}>
                  <Text style={styles.heroButtonText}>+ Run</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const MyPlanModal = () => {
    const [generating, setGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);

    const generatePlan = async () => {
      setGenerating(true);
      setGeneratedPlan(null);
      try {
         const prompt = `Synthesize a highly personalized health plan based on this data:
Vitals: ${vitalsHistory.length > 0 ? `HR ${vitalsHistory[0].hr}, BP ${vitalsHistory[0].bpSys}/${vitalsHistory[0].bpDia}` : 'No recent scans'}
Activity: ${activityData.steps} steps, ${activityData.activeMinutes} mins active.
Liquid: ${liquidLogs.reduce((a,c) => a+c.amount, 0)}ml today.
Please format exactly in three bulleted sections:
- Hydration & Nutrition
- Physical Fitness
- Rest & Sleep
Keep it encouraging and brief.`;

         const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              messages: [{ role: 'user', parts: [{ text: prompt }] }],
              userInfo, location, deviceId
            }),
          });
          const data = await response.json();
          setGeneratedPlan(data.reply);
          speakText("I have synthesized a personalized health plan for you based on your recent data. Let me know what you think!");
      } catch (e) {
         setGeneratedPlan("Failed to generate plan. Please try again.");
      } finally {
         setGenerating(false);
      }
    };

    return (
      <Modal visible={activeModal === 'myplan'} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Health Plan</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><X color="#FFF" size={24}/></TouchableOpacity>
            </View>

            {!generatedPlan ? (
              <View style={{alignItems: 'center', marginVertical: 30}}>
                 <Text style={{color: COLORS.textSub, textAlign: 'center', marginBottom: 24, fontSize: 16}}>
                    Ogoo will pull your latest vitals, hydration levels, and activity logs to synthesize a tailored wellness plan.
                 </Text>
                 <TouchableOpacity onPress={generatePlan} disabled={generating} style={[styles.heroButtonPrimary, {width: '100%', opacity: generating ? 0.5 : 1}]}>
                    {generating ? <ActivityIndicator color="#FFF" /> : <RefreshCcw color="white" size={18} style={{marginRight:8}}/>}
                    <Text style={styles.heroButtonText}>{generating ? "Synthesizing..." : "Generate My Plan"}</Text>
                 </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{maxHeight: 400}}>
                 <Text style={{color: '#FFF', fontSize: 15, lineHeight: 24}}>
                   {generatedPlan}
                 </Text>
                 <TouchableOpacity onPress={() => setGeneratedPlan(null)} style={[styles.heroButtonSecondary, {marginTop: 20}]}>
                    <Text style={[styles.heroButtonText, {color: COLORS.accent}]}>Regenerate Plan</Text>
                 </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const DashboardContent = () => {
    if (!showDashboard) return null;

    return (
      <View style={styles.dashboardContainer}>
        <View style={styles.welcomeHero}>
          <Text style={styles.welcomeTitle}>Welcome! 👋</Text>
          <Text style={styles.welcomeSub}>
            I'm Ogoo, your personal health companion. I'm here to help you track your vitals,
            manage your fitness plans, and answer any health questions you may have.
          </Text>

          {/* New Horizontal Action Buttons */}
          <View style={styles.heroActionRow}>
            <TouchableOpacity onPress={() => setActiveModal('liquid')} style={styles.heroButtonPrimary}>
              <Heart color="white" size={16} fill="white" style={{ marginRight: 8 }} />
              <Text style={styles.heroButtonText}>Liquid Intake</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActiveModal('plan')} style={styles.heroButtonSecondary}>
              <Calendar color={COLORS.accent} size={16} style={{ marginRight: 8 }} />
              <Text style={[styles.heroButtonText, { color: COLORS.accent }]}>Plan Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => setActiveModal('vitals')} style={styles.vitalsCard}>
          <View style={styles.heartIconCircle}>
            <Heart color="#FF4B4B" fill="#FF4B4B" size={22} />
          </View>
          <View>
            <Text style={styles.cardHeader}>Check vitals</Text>
            <Text style={styles.cardSub}>Let's see how your heart is beating</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.gridRow}>
          <TouchableOpacity onPress={() => setActiveModal('activity')} style={styles.smallCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#342E5E' }]}>
              <Activity color={COLORS.accent} size={20} />
            </View>
            <Text style={styles.smallCardText}>Daily activity</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveModal('myplan')} style={styles.smallCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#342E5E' }]}>
              <Calendar color={COLORS.accent} size={20} />
            </View>
            <Text style={styles.smallCardText}>View my plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      <MenuOverlay />
      <LiquidModal />
      <PlanModal />
      <VitalsModal />
      <ActivityModal />
      <MyPlanModal />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<DashboardContent />}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.fromUser ? styles.userBubble : styles.ogooBubble]}>
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.listPadding}
        ListFooterComponent={isLoading ? (
          <View style={[styles.bubble, styles.ogooBubble, styles.loadingBubble]}>
            <ActivityIndicator size="small" color={COLORS.accent} />
          </View>
        ) : null}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity onPress={startSpeechRecognition} style={[styles.micButton, isRecording && { backgroundColor: 'rgba(255, 75, 75, 0.15)', borderRadius: 12, paddingVertical: 4 }]}>
              <Mic color={isRecording ? '#FF4B4B' : COLORS.textSub} size={20} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Reply to Ogoo..."
              placeholderTextColor="#666"
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);
                if (forceDashboard !== null) setForceDashboard(null);
              }}
              editable={!isLoading}
              onFocus={() => {
                setIsFocused(true);
                if (forceDashboard !== null) setForceDashboard(null);
              }}
              onBlur={() => setIsFocused(false)}
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={[styles.sendButton, { opacity: (isLoading || !inputText.trim()) ? 0.5 : 1 }]}
              disabled={isLoading || !inputText.trim()}
            >
              <Send color="white" size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarMini: { width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 1, borderColor: COLORS.accent },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.online, marginRight: 6 },
  headerStatus: { fontSize: 11, color: COLORS.textSub, fontWeight: '500' },
  menuCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center' },
  dashboardContainer: { marginBottom: 25 },
  imageWrapper: { position: 'relative', borderRadius: 24, overflow: 'hidden', marginBottom: 20 },
  welcomeImage: { width: '100%', height: 220 },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(18, 14, 33, 0.2)' },
  vitalsCard: {
    backgroundColor: COLORS.card,
    padding: 18,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heartIconCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255, 75, 75, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardHeader: { fontSize: 17, fontWeight: '700', color: COLORS.textMain },
  cardSub: { fontSize: 13, color: COLORS.textSub, marginTop: 4 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  smallCard: {
    backgroundColor: COLORS.card,
    width: '48%',
    padding: 20,
    borderRadius: 24,
    alignItems: 'flex-start',
  },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  smallCardText: { fontWeight: '600', color: COLORS.textMain, fontSize: 14 },
  listPadding: { paddingHorizontal: 25, paddingBottom: 20 },
  bubble: { padding: 16, borderRadius: 20, marginBottom: 12, maxWidth: '85%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: COLORS.userBubble, borderBottomRightRadius: 4 },
  ogooBubble: { alignSelf: 'flex-start', backgroundColor: COLORS.card, borderBottomLeftRadius: 4 },
  bubbleText: { color: COLORS.textMain, fontSize: 15, lineHeight: 22 },
  loadingBubble: { width: 70, alignItems: 'center' },
  inputContainer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 30,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#342E5E'
  },
  micButton: { paddingHorizontal: 12 },
  input: { flex: 1, color: COLORS.textMain, fontSize: 15, height: 40 },
  sendButton: {
    backgroundColor: COLORS.userBubble,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  welcomeTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  welcomeTitle: {
    color: COLORS.textMain,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  welcomeSub: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    marginBottom: 25
  },
  // dashboardContainer: { 
  //   marginBottom: 25 
  // },
  welcomeHero: {
    backgroundColor: COLORS.card, // Lighter purple card
    padding: 24,
    borderRadius: 28,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#342E5E',
  },
  // welcomeTitle: {
  //   color: COLORS.textMain,
  //   fontSize: 26,
  //   fontWeight: '800',
  //   marginBottom: 10,
  // },
  // welcomeSub: {
  //   color: COLORS.textSub,
  //   fontSize: 15,
  //   lineHeight: 22,
  //   fontWeight: '400',
  //   marginBottom: 20,
  // },
  heroActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.userBubble, // Vivid Purple
    paddingVertical: 12,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.userBubble,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
  },
  heroButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  heroButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  menuContent: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  closeButton: {
    padding: 4,
  },
  userInfoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#342E5E',
  },
  userIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.userBubble,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSub,
    marginBottom: 20,
  },
  deviceInfoBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 16,
    borderRadius: 12,
  },
  deviceInfoText: {
    color: COLORS.textSub,
    fontSize: 13,
    marginBottom: 4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#342E5E',
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: '800'
  },
  radialContainer: {
    alignItems: 'center',
    marginBottom: 24
  },
  radialOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: '#342E5E',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative'
  },
  radialInner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(157, 141, 241, 0.4)',
  },
  radialText: {
    color: COLORS.textMain,
    fontSize: 24,
    fontWeight: '800',
    zIndex: 1
  },
  radialSub: {
    color: COLORS.textSub,
    fontSize: 12,
    zIndex: 1
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#342E5E'
  },
  catBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E1938',
    borderWidth: 1,
    borderColor: '#342E5E'
  },
  catBadgeActive: {
    backgroundColor: COLORS.userBubble,
    borderColor: COLORS.userBubble
  },
  catBadgeText: {
    color: COLORS.textSub,
    fontSize: 13,
    fontWeight: '600'
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#342E5E'
  },
  sensorCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(157, 141, 241, 0.1)',
    borderWidth: 2,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center'
  },
  vitalItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4
  },
  statValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800'
  },
  statLabel: {
    color: COLORS.textSub,
    fontSize: 12,
    marginTop: 4
  }
});