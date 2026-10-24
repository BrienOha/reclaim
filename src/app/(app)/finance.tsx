import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useThemeStore } from '@/store/useThemeStore';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useAuthStore } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Sticker } from '@/components/ui/Sticker';
import { EmptyState } from '@/components/ui/EmptyState';
import { SyncIndicator } from '@/components/ui/SyncIndicator';
import { useFinanceData } from '@/hooks/queries/useFinanceData';
import { Database } from '@/types/database.types';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

type Expense = Database['public']['Tables']['finance_expenses']['Row'];
type Wishlist = Database['public']['Tables']['finance_wishlist']['Row'];
type FinanceWeek = Database['public']['Tables']['finance_weeks']['Row'];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EXPENSE_CATEGORIES = ['Food', 'Commute', 'Gear', 'Entertainment', 'Subscriptions', 'Misc'];

export default function FinanceScreen() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const { currency, formatAmount } = useCurrencyStore();

  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = (day + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    return monday.toISOString().split('T')[0];
  });

  const {
    weekData,
    expenses,
    wishlist,
    isLoading,
    saveBudget,
    createExpense,
    deleteExpense,
    createWishlistItem,
    updateWishlistItem,
    deleteWishlistItem,
  } = useFinanceData(currentWeekStartDate);

  // Modals
  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Food');
  const [expNote, setExpNote] = useState('');

  const [editBudgetModalVisible, setEditBudgetModalVisible] = useState(false);
  const [allowanceInput, setAllowanceInput] = useState('');
  const [savingsInput, setSavingsInput] = useState('');

  const [addWishlistModalVisible, setAddWishlistModalVisible] = useState(false);
  const [wishItemName, setWishItemName] = useState('');
  const [wishPrice, setWishPrice] = useState('');
  const [wishImage, setWishImage] = useState('');

  // Savings Projector "What-if" slider extra amount
  const [extraWeeklySavings, setExtraWeeklySavings] = useState(500);

  useEffect(() => {
    if (weekData) {
      setAllowanceInput(String(weekData.allowance_amount));
      setSavingsInput(String(weekData.savings_allocation));
    }
  }, [weekData]);

  const allowance = weekData?.allowance_amount || 0;
  const savings = weekData?.savings_allocation || 0;
  const availableSpendBudget = Math.max(0, allowance - savings);

  const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const remainingBudget = availableSpendBudget - totalSpent;
  const isOverspent = remainingBudget < 0;

  // Add Expense
  const handleAddExpense = async () => {
    if (!user) return;
    const amt = parseFloat(expAmount);
    if (isNaN(amt) || amt <= 0) return;
    triggerHaptic('success');

    await createExpense({
      week_id: weekData?.id,
      expense_date: new Date().toISOString().split('T')[0],
      amount: amt,
      category: expCategory,
      note: expNote.trim() || null,
    });

    setAddExpenseModalVisible(false);
    setExpAmount('');
    setExpNote('');
  };

  // Save Allowance & Savings Target
  const handleSaveBudget = async () => {
    if (!user) return;
    const a = parseFloat(allowanceInput) || allowance;
    const s = parseFloat(savingsInput) || savings;

    await saveBudget({
      id: weekData?.id,
      allowance_amount: a,
      savings_allocation: s,
      currency: currency.code || 'PHP',
    });
    setEditBudgetModalVisible(false);
  };

  // Add Wishlist Item
  const handleAddWishlist = async () => {
    if (!user) return;
    const p = parseFloat(wishPrice);
    if (!wishItemName.trim() || isNaN(p) || p <= 0) return;
    triggerHaptic('success');

    await createWishlistItem({
      item_name: wishItemName.trim(),
      price: p,
      image_url: wishImage.trim() || null,
      priority: 'high',
      is_bought: false,
    });

    setAddWishlistModalVisible(false);
    setWishItemName('');
    setWishPrice('');
    setWishImage('');
  };

  // Toggle Bought It!
  const handleToggleBought = async (item: Wishlist) => {
    if (!user) return;
    triggerHaptic('success');
    await updateWishlistItem({
      itemId: item.id,
      updates: {
        is_bought: !item.is_bought,
        bought_at: !item.is_bought ? new Date().toISOString() : null,
      },
    });
  };

  // Daily Chart Calculations
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailySpendMap: Record<string, number> = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };

  expenses.forEach((exp) => {
    if (!exp.expense_date) return;
    const d = new Date(exp.expense_date);
    if (!isNaN(d.getTime())) {
      const dayName = daysOfWeek[d.getDay()];
      if (dailySpendMap[dayName] !== undefined) {
        dailySpendMap[dayName] += Number(exp.amount) || 0;
      }
    }
  });

  const maxDaily = Math.max(...Object.values(dailySpendMap), 100);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.title, { color: colors.text }]}>
                WEEKLY FINANCE TRACKER
              </Text>
              <SyncIndicator />
            </View>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Organized in weeks • Fuel creation & savings goals.
            </Text>
          </View>
          <Button
            title="+ Log Expense"
            onPress={() => setAddExpenseModalVisible(true)}
            variant="mint"
            size="sm"
          />
        </View>

        {/* Week Navigator */}
        <Card style={styles.weekNavCard}>
          <Pressable
            style={styles.weekNavArrow}
            onPress={() => triggerHaptic('light')}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <View style={styles.weekInfo}>
            <Sticker text="CURRENT WEEK" color="yellow" rotation={0} />
            <Text style={[styles.weekDateRange, { color: colors.text }]}>
              OCTOBER 19 – OCTOBER 25, 2026
            </Text>
          </View>
          <Pressable
            style={styles.weekNavArrow}
            onPress={() => triggerHaptic('light')}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </Card>

        {/* Overspend Alert Warning if applicable */}
        {isOverspent && (
          <Card bgColor={colors.hotPink} style={styles.warningCard}>
            <View style={styles.warningRow}>
              <Ionicons name="warning" size={24} color="#000000" />
              <View style={styles.warningText}>
                <Text style={styles.warningTitle}>OVERSPEND WARNING!</Text>
                <Text style={styles.warningDesc}>
                  You have exceeded this week's spending budget by {formatAmount(Math.abs(remainingBudget))}. Pause non-essential purchases.
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Weekly Budget Status Grid */}
        <View style={styles.budgetGrid}>
          {/* Allowance & Savings Settings Card */}
          <Card style={styles.budgetCard}>
            <View style={styles.budgetTop}>
              <Text style={[styles.budgetLabel, { color: colors.muted }]}>
                WEEKLY ALLOWANCE
              </Text>
              <Pressable onPress={() => setEditBudgetModalVisible(true)}>
                <Ionicons name="pencil" size={16} color={colors.text} />
              </Pressable>
            </View>
            <Text style={[styles.budgetValue, { color: colors.text }]}>
              {formatAmount(allowance)}
            </Text>
            <Text style={[styles.savingsSubtext, { color: colors.mintGreen }]}>
              + {formatAmount(savings)} set aside for savings
            </Text>
          </Card>

          {/* Remaining Spend Budget */}
          <Card
            bgColor={isOverspent ? colors.hotPink : colors.electricYellow}
            style={styles.budgetCard}
          >
            <Text style={styles.budgetLabelDark}>REMAINING THIS WEEK</Text>
            <Text style={styles.budgetValueDark}>
              {formatAmount(remainingBudget)}
            </Text>
            <Text style={styles.budgetHintDark}>
              Total spent so far: {formatAmount(totalSpent)}
            </Text>
          </Card>
        </View>

        {/* Daily Spend Neo-Brutalist SVG Bar Chart */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              DAILY SPEND BREAKDOWN
            </Text>
            <Text style={[styles.chartSubtitle, { color: colors.muted }]}>
              PEAK: {formatAmount(maxDaily)}
            </Text>
          </View>

          <View style={styles.chartWrapper}>
            <Svg width="100%" height={140} viewBox="0 0 320 140">
              {DAYS_OF_WEEK.map((day, idx) => {
                const amount = dailySpendMap[day] || 0;
                const barHeight = Math.max(10, (amount / maxDaily) * 90);
                const x = idx * 45 + 10;
                const y = 110 - barHeight;

                return (
                  <React.Fragment key={day}>
                    <Rect
                      x={x}
                      y={y}
                      width={30}
                      height={barHeight}
                      fill={amount > 0 ? colors.skyBlue : colors.surfaceSubtle}
                      stroke="#000000"
                      strokeWidth={2.5}
                      rx={4}
                    />
                    <SvgText
                      x={x + 15}
                      y={130}
                      fill={colors.text}
                      fontSize={11}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {day}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        </Card>

        {/* Expenses List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            THIS WEEK'S LOGGED EXPENSES
          </Text>
        </View>

        <View style={styles.expensesList}>
          {expenses.length === 0 ? (
            <EmptyState
              title="NO EXPENSES LOGGED"
              description="Keep tabs on every cent. Track your impulse triggers or daily essentials."
              iconName="receipt-outline"
              actionTitle="+ Log First Expense"
              onAction={() => setAddExpenseModalVisible(true)}
              actionVariant="primary"
            />
          ) : (
            expenses.map((exp) => (
              <Card key={exp.id} style={styles.expenseItem}>
                <View style={styles.expLeft}>
                  <Chip label={exp.category.toUpperCase()} color="yellow" />
                  <View style={styles.expDetails}>
                    <Text style={[styles.expNote, { color: colors.text }]}>
                      {exp.note || exp.category}
                    </Text>
                    <Text style={[styles.expDate, { color: colors.muted }]}>
                      {exp.expense_date}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={[styles.expAmount, { color: colors.text }]}>
                    -{formatAmount(Number(exp.amount))}
                  </Text>
                  <Pressable
                    onPress={() => {
                      triggerHaptic('warning');
                      deleteExpense(exp.id);
                    }}
                    style={{ padding: 4 }}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.hotPink} />
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Savings Projector */}
        <Card style={styles.projectorCard}>
          <View style={styles.projectorHeader}>
            <Sticker text="SAVINGS PROJECTOR" color="mint" rotation={-1} />
            <Text style={[styles.projectorCurrentRate, { color: colors.text }]}>
              Base Rate: {formatAmount(savings)} / week
            </Text>
          </View>
          <Text style={[styles.projectorDesc, { color: colors.muted }]}>
            See how your creative gear fund compounds over time.
          </Text>

          {/* Interactive Extra Savings Selector */}
          <Text style={[styles.sliderLabel, { color: colors.text }]}>
            WHAT IF I SAVE EXTRA PER WEEK?
          </Text>
          <View style={styles.extraPillsRow}>
            {[0, 500, 1000, 2000].map((amt) => (
              <Chip
                key={amt}
                label={`+${formatAmount(amt)}`}
                color="mint"
                isSelected={extraWeeklySavings === amt}
                onPress={() => setExtraWeeklySavings(amt)}
              />
            ))}
          </View>

          {/* Projection Timeline Cards */}
          <View style={styles.projectionsRow}>
            <View
              style={[
                styles.projectionBox,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.projHorizon, { color: colors.muted }]}>
                IN 1 MONTH
              </Text>
              <Text style={[styles.projTotal, { color: colors.text }]}>
                {formatAmount((savings + extraWeeklySavings) * 4)}
              </Text>
            </View>

            <View
              style={[
                styles.projectionBox,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.projHorizon, { color: colors.muted }]}>
                IN 3 MONTHS
              </Text>
              <Text style={[styles.projTotal, { color: colors.text }]}>
                {formatAmount((savings + extraWeeklySavings) * 12)}
              </Text>
            </View>

            <View
              style={[
                styles.projectionBox,
                {
                  backgroundColor: colors.electricYellow,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={styles.projHorizonDark}>IN 6 MONTHS</Text>
              <Text style={styles.projTotalDark}>
                {formatAmount((savings + extraWeeklySavings) * 26)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Purchase Goals (Wishlist) */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              PURCHASE GOALS / WISHLIST
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
              Fund your craft gear through consistent weekly savings.
            </Text>
          </View>
          <Button
            title="+ Add Item"
            onPress={() => setAddWishlistModalVisible(true)}
            variant="accent"
            size="sm"
          />
        </View>

        <View style={styles.wishlistGrid}>
          {wishlist.length === 0 ? (
            <EmptyState
              title="EMPTY GEAR WISHLIST"
              description="Add creative gear (microphones, lenses, sketchbooks) to fund with your weekly savings."
              iconName="bag-outline"
              actionTitle="+ Add First Item"
              onAction={() => setAddWishlistModalVisible(true)}
              actionVariant="accent"
            />
          ) : (
            wishlist.map((item) => {
            const totalSavedPool = savings * 6; // Simulated accumulated savings pool
            const progress = Math.min(1, totalSavedPool / item.price);
            const weeksNeeded = Math.ceil(item.price / Math.max(1, savings));

            return (
              <Card
                key={item.id}
                style={(item.is_bought ? StyleSheet.flatten([styles.wishCard, { opacity: 0.7 }]) : styles.wishCard) as ViewStyle}
              >
                <View style={styles.wishTop}>
                  <View style={styles.wishTitleText}>
                    <Text
                      style={[
                        styles.wishName,
                        {
                          color: colors.text,
                          textDecorationLine: item.is_bought
                            ? 'line-through'
                            : 'none',
                        },
                      ]}
                    >
                      {item.item_name}
                    </Text>
                    <Text style={[styles.wishPrice, { color: colors.mintGreen }]}>
                      {formatAmount(item.price)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Button
                      title={item.is_bought ? 'Bought! 🎉' : 'Buy Goal'}
                      onPress={() => handleToggleBought(item)}
                      variant={item.is_bought ? 'mint' : 'outline'}
                      size="sm"
                    />
                    <Pressable
                      onPress={() => {
                        triggerHaptic('warning');
                        deleteWishlistItem(item.id);
                      }}
                      style={{ padding: 4 }}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.hotPink} />
                    </Pressable>
                  </View>
                </View>

                {!item.is_bought && (
                  <>
                    <ProgressBar
                      progress={progress}
                      label={`Savings Progress (${formatAmount(totalSavedPool)} saved)`}
                      fillColor={colors.electricYellow}
                    />
                    <Text style={[styles.wishEstimate, { color: colors.muted }]}>
                      ⏳ Can afford in ~{weeksNeeded} weeks at current savings rate
                    </Text>
                  </>
                )}
              </Card>
            );
          })
        )}
      </View>

        {/* Add Expense Modal */}
        <Modal
          visible={addExpenseModalVisible}
          onClose={() => setAddExpenseModalVisible(false)}
          title="LOG DAILY EXPENSE"
          subtitle="Keep daily expenses accurate to protect your allowance."
          headerColor={colors.mintGreen}
        >
          <Input
            label={`AMOUNT (${currency.symbol})`}
            placeholder="e.g. 150"
            keyboardType="numeric"
            value={expAmount}
            onChangeText={setExpAmount}
          />

          <Text style={[styles.modalFieldLabel, { color: colors.text }]}>
            CATEGORY
          </Text>
          <View style={styles.categoryPillsRow}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={cat.toUpperCase()}
                color="yellow"
                isSelected={expCategory === cat}
                onPress={() => setExpCategory(cat)}
              />
            ))}
          </View>

          <Input
            label="NOTE (OPTIONAL)"
            placeholder="e.g. Art paper, Coffee, Train"
            value={expNote}
            onChangeText={setExpNote}
          />

          <Button
            title="Save Expense"
            onPress={handleAddExpense}
            variant="mint"
            size="md"
          />
        </Modal>

        {/* Edit Weekly Allowance & Savings Modal */}
        <Modal
          visible={editBudgetModalVisible}
          onClose={() => setEditBudgetModalVisible(false)}
          title="SET WEEKLY ALLOWANCE & SAVINGS"
          subtitle="Configure your recurring weekly baseline."
          headerColor={colors.electricYellow}
        >
          <Input
            label={`WEEKLY ALLOWANCE (${currency.symbol})`}
            placeholder="5000"
            keyboardType="numeric"
            value={allowanceInput}
            onChangeText={setAllowanceInput}
          />

          <Input
            label={`SET ASIDE FOR SAVINGS (${currency.symbol})`}
            placeholder="1500"
            keyboardType="numeric"
            value={savingsInput}
            onChangeText={setSavingsInput}
          />

          <Button
            title="Update Baseline"
            onPress={handleSaveBudget}
            variant="accent"
            size="md"
          />
        </Modal>

        {/* Add Wishlist Modal */}
        <Modal
          visible={addWishlistModalVisible}
          onClose={() => setAddWishlistModalVisible(false)}
          title="ADD PURCHASE GOAL (WISHLIST)"
          subtitle="Gear and equipment that levels up your hobbies."
          headerColor={colors.hotPink}
        >
          <Input
            label="ITEM NAME"
            placeholder="e.g. Drawing Screen Tablet, Mic Kit"
            value={wishItemName}
            onChangeText={setWishItemName}
          />

          <Input
            label={`PRICE (${currency.symbol})`}
            placeholder="18500"
            keyboardType="numeric"
            value={wishPrice}
            onChangeText={setWishPrice}
          />

          <Input
            label="OPTIONAL IMAGE / PRODUCT LINK"
            placeholder="https://..."
            value={wishImage}
            onChangeText={setWishImage}
          />

          <Button
            title="Save Purchase Goal"
            onPress={handleAddWishlist}
            variant="primary"
            size="md"
          />
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 18,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  weekNavCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 14,
  },
  weekNavArrow: {
    padding: 8,
  },
  weekInfo: {
    alignItems: 'center',
    gap: 4,
  },
  weekDateRange: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  warningCard: {
    padding: 14,
    marginBottom: 14,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
  },
  warningDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    marginTop: 2,
  },
  budgetGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  budgetCard: {
    flex: 1,
    padding: 14,
  },
  budgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  budgetLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  budgetValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  savingsSubtext: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  budgetLabelDark: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
  },
  budgetValueDark: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  budgetHintDark: {
    fontSize: 11,
    fontWeight: '800',
    color: '#222222',
    marginTop: 4,
  },
  chartCard: {
    padding: 16,
    marginBottom: 18,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  chartSubtitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  chartWrapper: {
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  expensesList: {
    gap: 8,
    marginBottom: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  expLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  expDetails: {
    flex: 1,
  },
  expNote: {
    fontSize: 14,
    fontWeight: '800',
  },
  expDate: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  expAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  projectorCard: {
    padding: 16,
    marginVertical: 14,
  },
  projectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectorCurrentRate: {
    fontSize: 12,
    fontWeight: '800',
  },
  projectorDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  extraPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  projectionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  projectionBox: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderRadius: NeoRadii.sm,
    alignItems: 'center',
  },
  projHorizon: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  projTotal: {
    fontSize: 16,
    fontWeight: '900',
  },
  projHorizonDark: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 4,
  },
  projTotalDark: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
  },
  wishlistGrid: {
    gap: 12,
  },
  wishCard: {
    padding: 14,
  },
  wishTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  wishTitleText: {
    flex: 1,
    marginRight: 8,
  },
  wishName: {
    fontSize: 15,
    fontWeight: '900',
  },
  wishPrice: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  wishEstimate: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
});
