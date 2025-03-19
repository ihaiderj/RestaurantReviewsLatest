import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

interface Table {
  id: string;
  status: 'reserved' | 'available';
  capacity: number;
}

interface FloorsConfig {
  [key: string]: Table[];
}

export default function BookTableScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: 'Esther Howard',
    email: 'example@gmail.com',
    phone: '(208) 555-0112',
    occasion: 'Birthday',
    guests: 4,
    selectedDate: 'Today',
    selectedTime: '17:00'
  });

  const floors = ['1st Floor', '2nd Floor', '3rd Floor'];
  const [selectedFloor, setSelectedFloor] = useState('1st Floor');

  const tables: FloorsConfig = {
    '1st Floor': [
      { id: 'T-01', status: 'reserved', capacity: 4 },
      { id: 'T-02', status: 'available', capacity: 2 },
      { id: 'T-03', status: 'reserved', capacity: 6 },
      { id: 'T-04', status: 'available', capacity: 4 },
      { id: 'T-05', status: 'available', capacity: 2 },
      { id: 'T-06', status: 'available', capacity: 8 },
      { id: 'T-07', status: 'available', capacity: 4 },
      { id: 'T-08', status: 'reserved', capacity: 6 },
      { id: 'T-09', status: 'available', capacity: 4 },
    ],
    '2nd Floor': [
      { id: 'T-11', status: 'available', capacity: 6 },
      { id: 'T-12', status: 'reserved', capacity: 4 },
      { id: 'T-13', status: 'available', capacity: 8 },
      { id: 'T-14', status: 'available', capacity: 2 },
      { id: 'T-15', status: 'reserved', capacity: 4 },
      { id: 'T-16', status: 'available', capacity: 6 },
      { id: 'T-17', status: 'available', capacity: 4 },
      { id: 'T-18', status: 'available', capacity: 2 },
    ],
    '3rd Floor': [
      { id: 'T-21', status: 'available', capacity: 8 },
      { id: 'T-22', status: 'available', capacity: 6 },
      { id: 'T-23', status: 'reserved', capacity: 4 },
      { id: 'T-24', status: 'available', capacity: 4 },
      { id: 'T-25', status: 'available', capacity: 2 },
      { id: 'T-26', status: 'reserved', capacity: 6 },
      { id: 'T-27', status: 'available', capacity: 4 },
      { id: 'T-28', status: 'available', capacity: 8 },
      { id: 'T-29', status: 'reserved', capacity: 2 },
      { id: 'T-30', status: 'available', capacity: 4 },
    ],
  };

  const dates = [
    { day: 'Today', date: '4 Jan' },
    { day: 'Mon', date: '5 Jan' },
    { day: 'Tue', date: '6 Jan' },
    { day: 'Wed', date: '7 Jan' },
  ];

  const timeSlots = [
    ['09:00', '09:30', '10:00', '10:30'],
    ['11:00', '11:30', '12:00', '12:30'],
    ['13:00', '13:30', '14:00', '14:30'],
    ['15:00', '15:30', '16:00', '16:30'],
    ['17:00', '17:30', '18:00', '18:30'],
    ['19:00', '19:30', '20:00', '20:30'],
    ['21:00', '21:30', '22:00', '22:30'],
  ];

  const [selectedTableInfo, setSelectedTableInfo] = useState<Table | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const renderStep1 = () => (
    <ScrollView style={styles.content}>
      <ThemedText style={styles.sectionTitle}>Your Information Details</ThemedText>

      {/* Form Fields */}
      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Name</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          placeholder="Enter your name"
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Email</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Phone Number</ThemedText>
        <View style={styles.phoneInput}>
          <TouchableOpacity style={styles.countryCode}>
            <ThemedText style={styles.countryCodeText}>+1</ThemedText>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
          <TextInput
            style={styles.phoneNumber}
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            placeholder="(208) 555-0112"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Occasion</ThemedText>
        <TouchableOpacity style={styles.selectInput}>
          <ThemedText style={styles.selectText}>{formData.occasion}</ThemedText>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.content}>
      {/* Guests Selection */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Guests</ThemedText>
        <View style={styles.guestsSelector}>
          <TouchableOpacity 
            style={styles.guestButton}
            onPress={() => setFormData(prev => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
          >
            <Ionicons name="remove" size={24} color="#6B4EFF" />
          </TouchableOpacity>
          <ThemedText style={styles.guestCount}>{formData.guests}</ThemedText>
          <TouchableOpacity 
            style={styles.guestButton}
            onPress={() => setFormData(prev => ({ ...prev, guests: prev.guests + 1 }))}
          >
            <Ionicons name="add" size={24} color="#6B4EFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Date</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.dateList}>
            {dates.map((date) => (
              <TouchableOpacity
                key={date.date}
                style={[
                  styles.dateItem,
                  formData.selectedDate === date.day && styles.selectedDate
                ]}
                onPress={() => setFormData(prev => ({ ...prev, selectedDate: date.day }))}
              >
                <ThemedText style={[
                  styles.dateDay,
                  formData.selectedDate === date.day && styles.selectedDateText
                ]}>
                  {date.day}
                </ThemedText>
                <ThemedText style={[
                  styles.dateText,
                  formData.selectedDate === date.day && styles.selectedDateText
                ]}>
                  {date.date}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Time</ThemedText>
        <View style={styles.timeGrid}>
          {timeSlots.map((row, i) => (
            <View key={i} style={styles.timeRow}>
              {row.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeItem,
                    formData.selectedTime === time && styles.selectedTime
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, selectedTime: time }))}
                >
                  <ThemedText style={[
                    styles.timeText,
                    formData.selectedTime === time && styles.selectedTimeText
                  ]}>
                    {time}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.content}>
      {/* Floor Selection */}
      <View style={styles.floorSelector}>
        {floors.map((floor) => (
          <TouchableOpacity
            key={floor}
            style={[
              styles.floorTab,
              selectedFloor === floor && styles.selectedFloorTab
            ]}
            onPress={() => setSelectedFloor(floor)}
          >
            <ThemedText style={[
              styles.floorText,
              selectedFloor === floor && styles.selectedFloorText
            ]}>
              {floor}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Table Status Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF4B55' }]} />
          <ThemedText style={styles.legendText}>Reserved</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <ThemedText style={styles.legendText}>Available</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6B4EFF' }]} />
          <ThemedText style={styles.legendText}>Selected</ThemedText>
        </View>
      </View>

      {/* Table Layout */}
      <View style={styles.tableLayout}>
        {tables[selectedFloor]?.map((table: Table) => (
          <TouchableOpacity
            key={table.id}
            style={[
              styles.tableContainer,
              table.status === 'reserved' && styles.reservedTable,
            ]}
            onPress={() => handleTableSelection(table)}
          >
            {/* Table Shape */}
            <View style={[
              styles.tableShape,
              table.status === 'reserved' && styles.reservedTableShape,
              table.status === 'available' && styles.availableTableShape,
              selectedTables.includes(table.id) && styles.selectedTableShape,
              table.capacity > 4 && styles.longTableShape,
            ]}>
              <ThemedText style={[
                styles.tableText,
                selectedTables.includes(table.id) && styles.selectedTableText
              ]}>
                {table.id}
              </ThemedText>
            </View>

            {/* Chair Indicators */}
            <View style={styles.chairIndicator}>
              <ThemedText style={[
                styles.chairCount,
                (table.status === 'reserved' || selectedTables.includes(table.id)) && styles.selectedChairCount
              ]}>
                {table.capacity} <Ionicons name="person" size={12} />
              </ThemedText>
            </View>

            {/* Table Border */}
            <View style={[
              styles.tableBorder,
              table.status === 'reserved' && styles.reservedTableBorder,
              table.status === 'available' && styles.availableTableBorder,
              selectedTables.includes(table.id) && styles.selectedTableBorder,
              table.capacity > 4 && styles.longTableBorder,
            ]} />
          </TouchableOpacity>
        ))}
      </View>

      {renderSelectedTablesSummary()}

      {showTooltip && selectedTableInfo && (
        <TableTooltip 
          table={selectedTableInfo} 
          onClose={() => {
            setShowTooltip(false);
            setSelectedTableInfo(null);
          }} 
        />
      )}
    </ScrollView>
  );

  const handleTableSelection = (table: Table) => {
    if (table.status === 'available') {
      setSelectedTableInfo(table);
      setShowTooltip(true);
    }
  };

  const renderSelectedTablesSummary = () => {
    if (selectedTables.length === 0) return null;

    const totalCapacity = selectedTables.reduce((sum, tableId) => {
      const table = Object.values(tables).flat().find(t => t.id === tableId);
      return sum + (table?.capacity || 0);
    }, 0);

    return (
      <View style={styles.selectedTablesSummary}>
        <ThemedText style={styles.summaryText}>
          Selected Tables: {selectedTables.join(', ')}
        </ThemedText>
        <ThemedText style={styles.summaryText}>
          Total Capacity: {totalCapacity} guests
        </ThemedText>
      </View>
    );
  };

  const TableTooltip = ({ table, onClose }: { table: Table; onClose: () => void }) => (
    <Modal
      transparent
      visible={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.tooltipOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.tooltipContainer}>
          <View style={styles.tooltip}>
            <ThemedText style={styles.tooltipTitle}>Table {table.id}</ThemedText>
            <View style={styles.tooltipContent}>
              <Ionicons name="people" size={20} color="#666" />
              <ThemedText style={styles.tooltipText}>
                Seats {table.capacity} guests
              </ThemedText>
            </View>
            {table.status === 'available' && (
              <TouchableOpacity 
                style={[
                  styles.selectTableButton,
                  selectedTables.includes(table.id) && styles.deselectTableButton
                ]}
                onPress={() => {
                  if (selectedTables.includes(table.id)) {
                    // Deselect table
                    setSelectedTables(prev => prev.filter(id => id !== table.id));
                  } else {
                    // Select table
                    setSelectedTables(prev => [...prev, table.id]);
                  }
                  onClose();
                }}
              >
                <ThemedText style={styles.selectTableText}>
                  {selectedTables.includes(table.id) ? 'Deselect Table' : 'Select Table'}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => step === 1 ? router.back() : setStep(step - 1)} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Book a Table</ThemedText>
      </View>

      {step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderStep3()}

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => {
            if (step === 1) {
              setStep(2);
            } else if (step === 2) {
              setStep(3);
            } else {
              // Navigate to booking summary
              router.push('/booking-summary');
            }
          }}
        >
          <ThemedText style={styles.continueText}>
            {step === 3 ? 'Reserve Table' : 'Continue'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    color: '#333',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
  },
  phoneInput: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    gap: 4,
  },
  countryCodeText: {
    fontSize: 15,
    color: '#333',
  },
  phoneNumber: {
    flex: 1,
    padding: 16,
    fontSize: 15,
    color: '#333',
  },
  selectInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 15,
    color: '#333',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  continueButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  guestsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  guestButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestCount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  dateList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  dateItem: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  selectedDate: {
    backgroundColor: '#6B4EFF',
  },
  dateDay: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedDateText: {
    color: '#fff',
  },
  timeGrid: {
    paddingHorizontal: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTime: {
    backgroundColor: '#6B4EFF',
  },
  timeText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTimeText: {
    color: '#fff',
  },
  floorSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  floorTab: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  selectedFloorTab: {
    backgroundColor: '#6B4EFF',
  },
  floorText: {
    fontSize: 14,
    color: '#666',
  },
  selectedFloorText: {
    color: '#fff',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  tableLayout: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    padding: 16,
  },
  tableContainer: {
    position: 'relative',
    width: 120,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
  },
  tableShape: {
    width: 80,
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  longTableShape: {
    width: 100,
    height: 60,
  },
  tableBorder: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 2,
    borderColor: '#F5F5F5',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  longTableBorder: {
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
  },
  availableTableShape: {
    backgroundColor: '#E8F5E9',
  },
  availableTableBorder: {
    borderColor: '#4CAF50',
  },
  reservedTableShape: {
    backgroundColor: '#FFE5E7',
  },
  reservedTableBorder: {
    borderColor: '#FF4B55',
  },
  selectedTableShape: {
    backgroundColor: '#6B4EFF',
  },
  selectedTableBorder: {
    borderColor: '#6B4EFF',
    borderStyle: 'solid',
  },
  tableText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedTableText: {
    color: '#fff',
  },
  chairIndicator: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chairCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedChairCount: {
    color: '#6B4EFF',
  },
  reservedTable: {
    opacity: 0.8,
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipContainer: {
    padding: 20,
    width: '80%',
  },
  tooltip: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  tooltipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  tooltipText: {
    fontSize: 16,
    color: '#666',
  },
  selectTableButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectTableText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deselectTableButton: {
    backgroundColor: '#FF4B55',
  },
  selectedTablesSummary: {
    backgroundColor: '#F5F3FF',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B4EFF',
    marginBottom: 4,
  },
}); 