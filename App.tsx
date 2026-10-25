import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { initDB, addUser, getUsersFromDB, User, saveAttendanceReport, getHistoryGroups, AttendanceRecord, updateUser, deleteUser, getAttendanceDetails, AttendanceDetail } from './database';

// اضافه کردن تایپ جدید برای تب تنظیمات
export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'manage' | 'history' | 'settings'>('home');
  const [users, setUsers] = useState<User[]>([]);
  const [historyGroups, setHistoryGroups] = useState<AttendanceRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [reportTitle, setReportTitle] = useState('');
  
  const [viewingReport, setViewingReport] = useState<{title: string, date: string} | null>(null);
  const [reportDetails, setReportDetails] = useState<AttendanceDetail[]>([]);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [resp, setResp] = useState('');

  useEffect(() => {
    initDB();
    loadData();
  }, []);

  const loadData = () => {
    setUsers(getUsersFromDB().sort((a, b) => a.lastName.localeCompare(b.lastName, 'fa')));
    setHistoryGroups(getHistoryGroups());
  };

  const handleSaveReport = () => {
    if (!reportTitle.trim()) {
      Alert.alert("خطا", "لطفاً عنوان آمار را وارد کنید");
      return;
    }
    saveAttendanceReport(reportTitle, selectedIds, users);
    Alert.alert("موفقیت", "آمار با موفقیت ثبت شد.");
    setReportTitle('');
    setSelectedIds([]);
    loadData();
    setActiveTab('history'); // انتقال به تب سوابق بعد از ثبت
  };

  const showDetails = (title: string, date: string) => {
    const details = getAttendanceDetails(title, date);
    setReportDetails(details);
    setViewingReport({ title, date });
  };

  const renderContent = () => {
    if (activeTab === 'home') {
      return (
        <View style={{ flex: 1 }}>
          <View style={styles.headerInputContainer}>
            <TextInput 
              placeholder="عنوان آمار را اینجا بنویسید (مثلاً آمار شامگاه)" 
              style={styles.titleInput}
              value={reportTitle}
              onChangeText={setReportTitle}
            />
          </View>
          <FlatList
            data={users}
            numColumns={3}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const isPresent = selectedIds.includes(item.id);
              return (
                <TouchableOpacity 
                  onPress={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])} 
                  style={[styles.card, isPresent && styles.selectedCard]}>
                  <Text style={[styles.nameText, isPresent && styles.whiteText]}>{item.lastName} {item.firstName}</Text>
                  <Text style={[styles.respText, isPresent && styles.whiteText]}>{item.responsibility}</Text>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={users.length > 0 ? <TouchableOpacity style={styles.finishBtn} onPress={handleSaveReport}><Text style={styles.whiteBtnText}>ثبت نهایی آمار</Text></TouchableOpacity> : null}
          />
        </View>
      );
    }

    if (activeTab === 'manage') {
      return (
        <ScrollView style={styles.containerPadding}>
          <Text style={styles.headerTitle}>مدیریت نفرات</Text>
          <View style={styles.addSection}>
            <TextInput placeholder="نام" style={styles.input} value={fName} onChangeText={setFName} />
            <TextInput placeholder="نام خانوادگی" style={styles.input} value={lName} onChangeText={setLName} />
            <TextInput placeholder="مسئولیت" style={styles.input} value={resp} onChangeText={setResp} />
            <TouchableOpacity style={styles.saveBtn} onPress={() => { addUser(fName, lName, resp); setFName(''); setLName(''); setResp(''); loadData(); }}>
              <Text style={styles.whiteBtnText}>افزودن فرد</Text>
            </TouchableOpacity>
          </View>
          {users.map((user) => (
            <TouchableOpacity key={user.id} style={styles.editRow} onPress={() => { setEditingUser(user); setFName(user.firstName); setLName(user.lastName); setResp(user.responsibility); }}>
              <Text style={styles.editText}>✏️ {user.lastName} {user.firstName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }

    if (activeTab === 'history') {
      if (viewingReport) {
        return (
          <View style={styles.containerPadding}>
            <TouchableOpacity onPress={() => setViewingReport(null)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← بازگشت به لیست سوابق</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>جزئیات: {viewingReport.title}</Text>
            <Text style={styles.dateSub}>تاریخ: {viewingReport.date}</Text>
            <View style={styles.statsSummary}>
              <Text style={styles.statItem}>حاضرین: {reportDetails.filter(d => d.status === 'حاضر').length}</Text>
              <Text style={[styles.statItem, {color: 'red'}]}>منفکین: {reportDetails.filter(d => d.status === 'منفک').length}</Text>
            </View>
            <ScrollView style={{marginTop: 10}}>
              {reportDetails.map((item, index) => (
                <View key={index} style={[styles.detailRow, item.status === 'منفک' && styles.absentRow]}>
                  <Text style={[styles.statusText, {color: item.status === 'حاضر' ? 'green' : 'red'}]}>{item.status}</Text>
                  <Text style={styles.detailName}>{item.lastName} {item.firstName}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        );
      }
      return (
        <ScrollView style={styles.containerPadding}>
          <Text style={styles.headerTitle}>سوابق کلی آمارها</Text>
          {historyGroups.map((group) => (
            <TouchableOpacity key={group.id} style={styles.historyCard} onPress={() => showDetails(group.title, group.date)}>
              <View style={styles.historyRow}>
                <Text style={styles.historyDate}>{group.date}</Text>
                <Text style={styles.historyTitle}>{group.title}</Text>
              </View>
              <View style={styles.historyStats}>
                <Text style={{color: 'red'}}>منفک: {group.absentCount}</Text>
                <Text style={{color: 'green'}}>حاضر: {group.presentCount}</Text>
              </View>
              <Text style={styles.clickForDetail}>برای مشاهده لیست نفرات کلیک کنید</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }

    if (activeTab === 'settings') {
      return (
        <View style={styles.containerPadding}>
          <Text style={styles.headerTitle}>تنظیمات</Text>
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => Alert.alert("درباره نرم‌افزار", "اپلیکیشن مدیریت آمار گروهان\nنسخه ۱.۰.۰\nطراحی شده برای سهولت در آمارگیری روزانه")}>
            <Text style={styles.settingText}>درباره نرم‌افزار</Text>
            <Text style={{fontSize: 20}}>ℹ️</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1 }}>{renderContent()}</View>

        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={() => {setActiveTab('home'); setViewingReport(null);}} style={styles.navItem}>
            <Text style={[styles.navIcon, activeTab === 'home' && styles.activeIcon]}>📋</Text>
            <Text style={[styles.navLabel, activeTab === 'home' && styles.activeLabel]}>آمارگیری</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {setActiveTab('manage'); setViewingReport(null);}} style={styles.navItem}>
            <Text style={[styles.navIcon, activeTab === 'manage' && styles.activeIcon]}>👥</Text>
            <Text style={[styles.navLabel, activeTab === 'manage' && styles.activeLabel]}>مدیریت</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {setActiveTab('history'); setViewingReport(null);}} style={styles.navItem}>
            <Text style={[styles.navIcon, activeTab === 'history' && styles.activeIcon]}>📜</Text>
            <Text style={[styles.navLabel, activeTab === 'history' && styles.activeLabel]}>سوابق</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {setActiveTab('settings'); setViewingReport(null);}} style={styles.navItem}>
            <Text style={[styles.navIcon, activeTab === 'settings' && styles.activeIcon]}>⚙️</Text>
            <Text style={[styles.navLabel, activeTab === 'settings' && styles.activeLabel]}>تنظیمات</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={editingUser !== null} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.editModalBody}>
              <Text style={styles.modalTitle}>ویرایش اطلاعات</Text>
              <TextInput style={styles.input} value={fName} onChangeText={setFName} placeholder="نام" />
              <TextInput style={styles.input} value={lName} onChangeText={setLName} placeholder="نام خانوادگی" />
              <TextInput style={styles.input} value={resp} onChangeText={setResp} placeholder="مسئولیت" />
              <TouchableOpacity style={styles.saveBtn} onPress={() => { updateUser(editingUser!.id, fName, lName, resp); setEditingUser(null); loadData(); }}>
                <Text style={styles.whiteBtnText}>ذخیره</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, {backgroundColor: 'red', marginTop: 10}]} onPress={() => { deleteUser(editingUser!.id); setEditingUser(null); loadData(); }}>
                <Text style={styles.whiteBtnText}>حذف فرد</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingUser(null)} style={{marginTop: 15}}><Text style={{textAlign: 'center', color: '#666'}}>انصراف</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // استایل‌های قبلی شما حفظ شده است
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  containerPadding: { padding: 20, flex: 1 },
  headerInputContainer: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  titleInput: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, textAlign: 'right', fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 10, color: '#2c3e50' },
  dateSub: { textAlign: 'center', color: '#7f8c8d', marginBottom: 15 },
  bottomNav: { flexDirection: 'row', height: 70, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navIcon: { fontSize: 22, color: '#bdc3c7' },
  activeIcon: { color: '#2980b9' },
  navLabel: { fontSize: 10, color: '#bdc3c7' },
  activeLabel: { color: '#2980b9', fontWeight: 'bold' },
  card: { flex: 1/3, margin: 5, padding: 15, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', elevation: 2 },
  selectedCard: { backgroundColor: '#2ecc71' },
  nameText: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  respText: { fontSize: 11, color: '#7f8c8d' },
  whiteText: { color: '#fff' },
  historyCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, elevation: 3 },
  historyRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 10 },
  historyTitle: { fontSize: 18, fontWeight: 'bold' },
  historyDate: { color: '#7f8c8d' },
  historyStats: { flexDirection: 'row-reverse', justifyContent: 'space-around', borderTopWidth: 1, paddingTop: 10, borderColor: '#f0f0f0' },
  clickForDetail: { textAlign: 'center', fontSize: 11, color: '#3498db', marginTop: 10 },
  detailRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 12, backgroundColor: '#fff', marginBottom: 2, borderRadius: 5 },
  absentRow: { backgroundColor: '#ffecec' },
  detailName: { fontSize: 16 },
  statusText: { fontWeight: 'bold' },
  statsSummary: { flexDirection: 'row-reverse', justifyContent: 'space-around', backgroundColor: '#eef2f3', padding: 15, borderRadius: 10 },
  statItem: { fontSize: 16, fontWeight: 'bold' },
  backBtn: { padding: 10, marginBottom: 10 },
  backBtnText: { color: '#2980b9', fontWeight: 'bold', textAlign: 'right' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, textAlign: 'right', borderWidth: 1, borderColor: '#ddd' },
  saveBtn: { backgroundColor: '#27ae60', padding: 15, borderRadius: 8, alignItems: 'center' },
  finishBtn: { backgroundColor: '#2980b9', padding: 18, borderRadius: 10, margin: 15, alignItems: 'center' },
  whiteBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  addSection: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20 },
  editRow: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 8, alignItems: 'flex-end' },
  editText: { fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  editModalBody: { width: '80%', backgroundColor: '#fff', padding: 25, borderRadius: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  
  // استایل‌های جدید برای صفحه تنظیمات
  settingItem: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#eee'
  },
  settingText: { fontSize: 16, color: '#333', fontWeight: '500' }
});
