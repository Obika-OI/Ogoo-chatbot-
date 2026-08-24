import re

with open("src/App.tsx", "r") as f:
    content = f.read()

menu_overlay_old = """            <View style={{marginTop: 20}}>
               <Text style={styles.cardHeader}>Team & Documents</Text>
               <TouchableOpacity style={[styles.vitalItem, { marginTop: 10, flexDirection: 'row', alignItems: 'center' }]}>
                 <Users color={COLORS.accent} size={20} style={{ marginRight: 15 }} />
                 <View>
                   <Text style={{color: '#FFF', fontSize: 15, fontWeight: '600'}}>Circle of Care</Text>
                   <Text style={{color: COLORS.textSub, fontSize: 12}}>Manage healthcare team & calendar</Text>
                 </View>
               </TouchableOpacity>

               <TouchableOpacity style={[styles.vitalItem, { marginTop: 10, flexDirection: 'row', alignItems: 'center' }]}>
                 <FileText color={COLORS.accent} size={20} style={{ marginRight: 15 }} />
                 <View>
                   <Text style={{color: '#FFF', fontSize: 15, fontWeight: '600'}}>Vital Documents</Text>
                   <Text style={{color: COLORS.textSub, fontSize: 12}}>Care plans, medical reports</Text>
                 </View>
               </TouchableOpacity>
               
               <TouchableOpacity style={[styles.vitalItem, { marginTop: 10, flexDirection: 'row', alignItems: 'center' }]}>
                 <Heart color={COLORS.accent} size={20} style={{ marginRight: 15 }} />
                 <View>
                   <Text style={{color: '#FFF', fontSize: 15, fontWeight: '600'}}>Life Experience Portal</Text>
                   <Text style={{color: COLORS.textSub, fontSize: 12}}>Support community network</Text>
                 </View>
               </TouchableOpacity>
            </View>"""

menu_overlay_new = """            <View style={{marginTop: 20}}>
               <Text style={styles.cardHeader}>Team & Documents</Text>
               <TouchableOpacity onPress={() => { setShowMenu(false); setActiveModal('circleOfCare'); }} style={[styles.vitalItem, { marginTop: 10, flexDirection: 'row', alignItems: 'center' }]}>
                 <Users color={COLORS.accent} size={20} style={{ marginRight: 15 }} />
                 <View>
                   <Text style={{color: '#FFF', fontSize: 15, fontWeight: '600'}}>Circle of Care</Text>
                   <Text style={{color: COLORS.textSub, fontSize: 12}}>Manage healthcare team & calendar</Text>
                 </View>
               </TouchableOpacity>

               <TouchableOpacity onPress={() => { setShowMenu(false); setActiveModal('documents'); }} style={[styles.vitalItem, { marginTop: 10, flexDirection: 'row', alignItems: 'center' }]}>
                 <FileText color={COLORS.accent} size={20} style={{ marginRight: 15 }} />
                 <View>
                   <Text style={{color: '#FFF', fontSize: 15, fontWeight: '600'}}>Vital Documents</Text>
                   <Text style={{color: COLORS.textSub, fontSize: 12}}>Care plans, medical reports</Text>
                 </View>
               </TouchableOpacity>
               
               <TouchableOpacity onPress={() => { setShowMenu(false); setActiveModal('supportNetwork'); }} style={[styles.vitalItem, { marginTop: 10, flexDirection: 'row', alignItems: 'center' }]}>
                 <Heart color={COLORS.accent} size={20} style={{ marginRight: 15 }} />
                 <View>
                   <Text style={{color: '#FFF', fontSize: 15, fontWeight: '600'}}>Life Experience Portal</Text>
                   <Text style={{color: COLORS.textSub, fontSize: 12}}>Support community network</Text>
                 </View>
               </TouchableOpacity>
            </View>"""

content = content.replace(menu_overlay_old, menu_overlay_new)

dashboard_old = """        <View style={styles.gridRow}>
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
        </View>"""

dashboard_new = """        <View style={styles.gridRow}>
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

        <View style={[styles.gridRow, { marginTop: 16 }]}>
          <TouchableOpacity onPress={() => setActiveModal('circleOfCare')} style={styles.smallCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#342E5E' }]}>
              <Users color={COLORS.accent} size={20} />
            </View>
            <Text style={styles.smallCardText}>Circle of Care</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveModal('documents')} style={styles.smallCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#342E5E' }]}>
              <FileText color={COLORS.accent} size={20} />
            </View>
            <Text style={styles.smallCardText}>Documents</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.gridRow, { marginTop: 16, marginBottom: 20 }]}>
          <TouchableOpacity onPress={() => setActiveModal('supportNetwork')} style={styles.smallCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#342E5E' }]}>
              <Heart color={COLORS.accent} size={20} />
            </View>
            <Text style={styles.smallCardText}>Support Network</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => triggerEmergency("User SOS Button")} style={[styles.smallCard, { backgroundColor: 'rgba(255, 75, 75, 0.2)', borderWidth: 2, borderColor: '#FF4B4B', borderRadius: 100, alignItems: 'center', justifyContent: 'center' }]}>
             <ShieldAlert color="#FF4B4B" size={40} />
             <Text style={[styles.smallCardText, { color: '#FF4B4B', marginTop: 12, fontWeight: 'bold' }]}>SOS SOS</Text>
          </TouchableOpacity>
        </View>"""

content = content.replace(dashboard_old, dashboard_new)

# Generate new modals
new_modals = """
  const CircleOfCareModal = () => {
    return (
      <Modal visible={activeModal === 'circleOfCare'} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, {maxHeight: '80%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Circle of Care</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><X color="#FFF" size={24}/></TouchableOpacity>
            </View>
            <ScrollView style={{marginTop: 10}}>
              <Text style={styles.cardHeader}>Healthcare Team</Text>
              <View style={[styles.vitalItem, {marginTop: 10}]}>
                 <Text style={{color: '#FFF', fontSize: 16, fontWeight: '600'}}>Dr. Sarah Jenkins</Text>
                 <Text style={{color: COLORS.textSub, marginTop: 4}}>Primary Care Physician</Text>
                 <TouchableOpacity style={{marginTop: 8}}><Text style={{color: COLORS.accent}}>Message</Text></TouchableOpacity>
              </View>
              <View style={[styles.vitalItem, {marginTop: 10}]}>
                 <Text style={{color: '#FFF', fontSize: 16, fontWeight: '600'}}>Mark Thompson</Text>
                 <Text style={{color: COLORS.textSub, marginTop: 4}}>Physical Therapist</Text>
                 <TouchableOpacity style={{marginTop: 8}}><Text style={{color: COLORS.accent}}>Message</Text></TouchableOpacity>
              </View>

              <Text style={[styles.cardHeader, {marginTop: 20}]}>Family Members</Text>
              <View style={[styles.vitalItem, {marginTop: 10}]}>
                 <Text style={{color: '#FFF', fontSize: 16, fontWeight: '600'}}>Emma (Daughter)</Text>
                 <Text style={{color: COLORS.textSub, marginTop: 4}}>Emergency Contact</Text>
              </View>

              <TouchableOpacity style={[styles.heroButtonPrimary, {marginTop: 20}]}><Text style={styles.heroButtonText}>Add New Member</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const DocumentsModal = () => {
    return (
      <Modal visible={activeModal === 'documents'} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, {maxHeight: '80%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vital Documents</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><X color="#FFF" size={24}/></TouchableOpacity>
            </View>
            <ScrollView style={{marginTop: 10}}>
              <View style={[styles.vitalItem, {marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}]}>
                 <View>
                   <Text style={{color: '#FFF', fontSize: 16, fontWeight: '600'}}>Annual Care Plan</Text>
                   <Text style={{color: COLORS.textSub, marginTop: 4}}>Updated Oct 2025</Text>
                 </View>
                 <FileText color={COLORS.accent} size={24}/>
              </View>
              <View style={[styles.vitalItem, {marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}]}>
                 <View>
                   <Text style={{color: '#FFF', fontSize: 16, fontWeight: '600'}}>Blood Test Results</Text>
                   <Text style={{color: COLORS.textSub, marginTop: 4}}>Aug 12, 2026</Text>
                 </View>
                 <FileText color={COLORS.accent} size={24}/>
              </View>
              <View style={[styles.vitalItem, {marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}]}>
                 <View>
                   <Text style={{color: '#FFF', fontSize: 16, fontWeight: '600'}}>Insurance Card</Text>
                   <Text style={{color: COLORS.textSub, marginTop: 4}}>Medicare</Text>
                 </View>
                 <FileText color={COLORS.accent} size={24}/>
              </View>

              <TouchableOpacity style={[styles.heroButtonSecondary, {marginTop: 20}]}><Text style={[styles.heroButtonText, {color: COLORS.accent}]}>Upload Document</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const SupportNetworkModal = () => {
    return (
      <Modal visible={activeModal === 'supportNetwork'} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, {maxHeight: '80%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Life Experience Portal</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><X color="#FFF" size={24}/></TouchableOpacity>
            </View>
            <ScrollView style={{marginTop: 10}}>
              <Text style={styles.cardSub}>Connect with your community and find local support.</Text>
              
              <Text style={[styles.cardHeader, {marginTop: 20}]}>Upcoming Local Events</Text>
              <View style={[styles.vitalItem, {marginTop: 10}]}>
                 <Text style={{color: '#FFF', fontSize: 16, fontWeight: '600'}}>Community Yoga</Text>
                 <Text style={{color: COLORS.textSub, marginTop: 4}}>Tomorrow, 10:00 AM @ Rec Center</Text>
                 <TouchableOpacity style={{marginTop: 8}}><Text style={{color: COLORS.online}}>RSVP</Text></TouchableOpacity>
              </View>

              <Text style={[styles.cardHeader, {marginTop: 20}]}>Support Groups</Text>
              <View style={[styles.vitalItem, {marginTop: 10}]}>
                 <Text style={{color: '#FFF', fontSize: 16, fontWeight: '600'}}>Caregivers Connect</Text>
                 <Text style={{color: COLORS.textSub, marginTop: 4}}>Online Forum - 12 active members</Text>
                 <TouchableOpacity style={{marginTop: 8}}><Text style={{color: COLORS.accent}}>Join Discussion</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
"""

# inject modals right before DashboardContent
content = content.replace("  const DashboardContent = () => {", new_modals + "\n  const DashboardContent = () => {")

# Add the modals to the main render
render_old = """      <LiquidModal />
      <NutritionModal />
      <VitalsModal />
      <ActivityModal />
      <MyPlanModal />"""

render_new = """      <LiquidModal />
      <NutritionModal />
      <VitalsModal />
      <ActivityModal />
      <MyPlanModal />
      <CircleOfCareModal />
      <DocumentsModal />
      <SupportNetworkModal />"""

content = content.replace(render_old, render_new)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("done")
