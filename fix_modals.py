import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update MyPlanModal to flow as one part
my_plan_modal_code = """
  const MyPlanModal = () => {
    // AI Plan states
    const [generating, setGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);

    // Routine states
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskCat, setNewTaskCat] = useState('💊 Medicine');
    
    // Notes states
    const [careNote, setCareNote] = useState('');

    const generatePlan = async () => {
      setGenerating(true);
      setGeneratedPlan(null);
      try {
         const prompt = `Synthesize a highly personalized health plan based on this data:
Vitals: ${vitalsHistory.length > 0 ? `HR ${vitalsHistory[0].hr}, BP ${vitalsHistory[0].bpSys}/${vitalsHistory[0].bpDia}` : 'No recent scans'}
Activity: ${activityData.steps} steps, ${activityData.activeMinutes} mins active.
Liquid: ${liquidLogs.reduce((a,c) => a+c.amount, 0)}ml today.
Nutrition: ${nutritionLogs.reduce((a,c) => a+c.calories, 0)} kcal today.
Please format exactly in three bulleted sections:
- Hydration & Nutrition
- Physical Fitness
- Rest & Sleep
Keep it encouraging and brief.`;

         let reply = '';

         if (!BACKEND_URL && GEMINI_API_KEY) {
           const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               contents: [{ role: 'user', parts: [{ text: prompt }] }]
             })
           });
           const resJson = await response.json();
           reply = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate plan. Please try again.";
         } else {
            const response = await fetch(`${BACKEND_URL}/api/chat`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ 
                 messages: [{ role: 'user', parts: [{ text: prompt }] }],
                 userInfo, location, deviceId
               }),
             });
             const data = await response.json();
             reply = data.reply;
         }

         setGeneratedPlan(reply);
         speakText("I have synthesized a personalized health plan for you based on your recent data. Let me know what you think!");
      } catch (e) {
         setGeneratedPlan("Failed to generate plan. Please try again.");
      } finally {
         setGenerating(false);
      }
    };

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
      <Modal visible={activeModal === 'myplan'} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { padding: 0 }]}>
            <View style={[styles.modalHeader, { padding: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#342E5E', marginBottom: 0 }]}>
              <Text style={styles.modalTitle}>My Health Plan & Schedule</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><X color="#FFF" size={24}/></TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20, maxHeight: 600 }}>
              {/* SECTION: AI Plan */}
              <Text style={[styles.cardHeader, {marginBottom: 10}]}>AI Plan Synthesis</Text>
              {!generatedPlan ? (
                <View style={{alignItems: 'center', marginVertical: 10, marginBottom: 30}}>
                   <Text style={{color: COLORS.textSub, textAlign: 'center', marginBottom: 15, fontSize: 14}}>
                      Ogoo will pull your latest vitals, hydration levels, nutrition and activity logs to synthesize a tailored wellness plan.
                   </Text>
                   <TouchableOpacity onPress={generatePlan} disabled={generating} style={[styles.heroButtonPrimary, {width: '100%', opacity: generating ? 0.5 : 1}]}>
                      {generating ? <ActivityIndicator color="#FFF" /> : <RefreshCcw color="white" size={18} style={{marginRight:8}}/>}
                      <Text style={styles.heroButtonText}>{generating ? "Synthesizing..." : "Generate My Plan"}</Text>
                   </TouchableOpacity>
                </View>
              ) : (
                <View style={{marginBottom: 30}}>
                   <Text style={{color: '#FFF', fontSize: 15, lineHeight: 24}}>
                     {generatedPlan}
                   </Text>
                   <TouchableOpacity onPress={() => setGeneratedPlan(null)} style={[styles.heroButtonSecondary, {marginTop: 20}]}>
                      <Text style={[styles.heroButtonText, {color: COLORS.accent}]}>Regenerate Plan</Text>
                   </TouchableOpacity>
                </View>
              )}

              {/* SECTION: Schedule & Routine */}
              <Text style={[styles.cardHeader, {marginBottom: 10, marginTop: 10}]}>Schedule & eMAR</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
                 {['💊 Medicine', '🏃 Exercise', '💧 Hydration', '🍏 Diet', '🧹 Chores', '📋 General'].map(cat => (
                   <TouchableOpacity key={cat} onPress={() => setNewTaskCat(cat)} style={[styles.catBadge, newTaskCat === cat && styles.catBadgeActive, {marginRight: 8}]}>
                      <Text style={[styles.catBadgeText, newTaskCat === cat && {color: '#FFF'}]}>{cat.split(' ')[0]} {cat.split(' ')[1]}</Text>
                   </TouchableOpacity>
                 ))}
              </ScrollView>

              <View style={[styles.inputWrapper, {marginBottom: 20}]}>
                 <TextInput 
                    style={styles.input} 
                    placeholder={`Add task/medication...`}
                    placeholderTextColor={COLORS.textSub}
                    value={newTaskText}
                    onChangeText={setNewTaskText}
                    onSubmitEditing={addTask}
                 />
                 <TouchableOpacity onPress={addTask} style={styles.sendButton}><Plus color="#FFF" size={18}/></TouchableOpacity>
              </View>

              <View style={{marginBottom: 30}}>
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
              </View>

              {/* SECTION: Care Notes */}
              <Text style={styles.cardHeader}>Daily Care Notes</Text>
              <Text style={styles.cardSub}>Record notes via typing or voice.</Text>
              
              <TextInput 
                 style={[styles.inputWrapper, { marginTop: 15, height: 120, color: '#FFF', textAlignVertical: 'top', padding: 15 }]} 
                 placeholder="Type care notes here..." 
                 placeholderTextColor={COLORS.textSub} 
                 multiline 
                 value={careNote}
                 onChangeText={setCareNote}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 40 }}>
                 <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center'}}><Mic color={COLORS.accent} size={18} /><Text style={{color: COLORS.accent, marginLeft: 5}}>Dictate voice note</Text></TouchableOpacity>
                 <TouchableOpacity style={[styles.heroButtonPrimary, { paddingVertical: 8, paddingHorizontal: 16 }]} onPress={() => { setCareNote(''); }}><Text style={styles.heroButtonText}>Save Note</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
"""

my_plan_modal_pattern = re.compile(r'  const MyPlanModal = \(\) => \{.*?\n  };\n', re.DOTALL)
content = my_plan_modal_pattern.sub(my_plan_modal_code, content)

with open("src/App.tsx", "w") as f:
    f.write(content)
