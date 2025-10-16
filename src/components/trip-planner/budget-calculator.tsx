'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Calculator,
  Target,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';

interface BudgetCalculatorProps {
  currentTrip: any;
}

interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  actual: number;
  currency: string;
  icon: string;
  color: string;
}

interface BudgetItem {
  id: string;
  categoryId: string;
  name: string;
  amount: number;
  currency: string;
  date?: Date;
  notes?: string;
  isEstimate: boolean;
}

const defaultCategories: Omit<BudgetCategory, 'id' | 'budgeted' | 'actual' | 'currency'>[] = [
  { name: 'Ulaşım', icon: '🚗', color: 'bg-blue-100 text-blue-800' },
  { name: 'Konaklama', icon: '🏨', color: 'bg-purple-100 text-purple-800' },
  { name: 'Yemek & İçecek', icon: '🍽️', color: 'bg-orange-100 text-orange-800' },
  { name: 'Aktiviteler', icon: '🎯', color: 'bg-green-100 text-green-800' },
  { name: 'Alışveriş', icon: '🛍️', color: 'bg-pink-100 text-pink-800' },
  { name: 'Diğer', icon: '💳', color: 'bg-gray-100 text-gray-800' },
];

export function BudgetCalculator({ currentTrip }: BudgetCalculatorProps) {
  const [totalBudget, setTotalBudget] = useState(currentTrip?.budget || 0);
  const [currency, setCurrency] = useState(currentTrip?.currency || 'TRY');
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Initialize categories and calculate actuals from trip activities
  useEffect(() => {
    const initialCategories = defaultCategories.map((cat, index) => ({
      ...cat,
      id: (index + 1).toString(),
      budgeted: Math.round(totalBudget * [0.25, 0.35, 0.20, 0.15, 0.03, 0.02][index] || 0),
      actual: 0,
      currency,
    }));

    // Calculate actual spending from trip activities
    if (currentTrip?.activities) {
      const activitySpending = currentTrip.activities.reduce((acc: any, activity: any) => {
        const categoryMap: Record<string, string> = {
          transport: '1',
          accommodation: '2',
          restaurant: '3',
          tour: '4',
          activity: '4',
          shopping: '5',
        };
        
        const categoryId = categoryMap[activity.category] || '6';
        acc[categoryId] = (acc[categoryId] || 0) + (activity.cost || 0);
        return acc;
      }, {});

      initialCategories.forEach(cat => {
        cat.actual = activitySpending[cat.id] || 0;
      });
    }

    setCategories(initialCategories);
  }, [currentTrip, totalBudget, currency]);

  // Calculate totals
  const totalBudgeted = categories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalActual = categories.reduce((sum, cat) => sum + cat.actual, 0);
  const totalRemaining = totalBudget - totalActual;
  const budgetUsagePercentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  const handleCategoryBudgetChange = (categoryId: string, newBudget: number) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, budgeted: newBudget } : cat
    ));
  };

  const handleAddBudgetItem = (item: Omit<BudgetItem, 'id'>) => {
    const newItem: BudgetItem = {
      ...item,
      id: Date.now().toString(),
    };

    setBudgetItems([...budgetItems, newItem]);
    
    // Update category actual
    setCategories(categories.map(cat => 
      cat.id === item.categoryId 
        ? { ...cat, actual: cat.actual + item.amount }
        : cat
    ));

    setIsAddingItem(false);
    toast.success('Harcama eklendi!');
  };

  const handleRemoveBudgetItem = (itemId: string) => {
    const item = budgetItems.find(i => i.id === itemId);
    if (!item) return;

    setBudgetItems(budgetItems.filter(i => i.id !== itemId));
    
    // Update category actual
    setCategories(categories.map(cat => 
      cat.id === item.categoryId 
        ? { ...cat, actual: Math.max(0, cat.actual - item.amount) }
        : cat
    ));

    toast.success('Harcama kaldırıldı!');
  };

  const getBudgetStatus = () => {
    if (budgetUsagePercentage <= 75) return { status: 'good', color: 'text-green-600', icon: CheckCircle };
    if (budgetUsagePercentage <= 90) return { status: 'warning', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'danger', color: 'text-red-600', icon: AlertTriangle };
  };

  const budgetStatus = getBudgetStatus();
  const StatusIcon = budgetStatus.icon;

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Bütçe Genel Bakış
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Total Budget Setting */}
            <div>
              <Label htmlFor="total-budget">Toplam Bütçe</Label>
              <div className="flex gap-2">
                <Input
                  id="total-budget"
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                  className="flex-1"
                />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">TRY</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Budget Status */}
            <div>
              <Label>Bütçe Durumu</Label>
              <div className="flex items-center gap-3 mt-2">
                <StatusIcon className={`h-5 w-5 ${budgetStatus.color}`} />
                <div className="flex-1">
                  <Progress value={budgetUsagePercentage} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>%{budgetUsagePercentage.toFixed(1)} kullanıldı</span>
                    <span>{totalRemaining.toFixed(2)} {currency} kaldı</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">
                {totalBudget.toFixed(2)} {currency}
              </div>
              <div className="text-sm text-blue-600">Toplam Bütçe</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-orange-50">
              <div className="text-2xl font-bold text-orange-600">
                {totalActual.toFixed(2)} {currency}
              </div>
              <div className="text-sm text-orange-600">Harcanan</div>
            </div>

            <div className={`text-center p-4 rounded-lg ${
              totalRemaining >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className={`text-2xl font-bold ${
                totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {totalRemaining.toFixed(2)} {currency}
              </div>
              <div className={`text-sm ${
                totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {totalRemaining >= 0 ? 'Kalan' : 'Aşım'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Kategori Dağılımı
            </CardTitle>
            <Button onClick={() => setIsAddingItem(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Harcama Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onBudgetChange={handleCategoryBudgetChange}
                items={budgetItems.filter(item => item.categoryId === category.id)}
                onRemoveItem={handleRemoveBudgetItem}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Bütçe Önerileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {budgetUsagePercentage > 90 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Bütçe Aşımı Riski</h4>
                  <p className="text-sm text-red-700">
                    Bütçenizin %90'ını kullandınız. Kalan aktiviteler için harcamalarınızı gözden geçirin.
                  </p>
                </div>
              </div>
            )}

            {categories.some(cat => cat.actual > cat.budgeted) && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Kategori Bütçe Aşımı</h4>
                  <p className="text-sm text-yellow-700">
                    Bazı kategorilerde bütçe aşımı var. Diğer kategorilerden tasarruf yapmayı düşünün.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Tasarruf İpucu</h4>
                <p className="text-sm text-blue-700">
                  Yemek harcamalarını azaltmak için yerel restoranları tercih edin. 
                  Aktivite maliyetlerini karşılaştırarak en uygun seçenekleri bulun.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Budget Item Modal */}
      {isAddingItem && (
        <AddBudgetItemModal
          categories={categories}
          onSave={handleAddBudgetItem}
          onCancel={() => setIsAddingItem(false)}
          currency={currency}
        />
      )}
    </div>
  );
}

interface CategoryCardProps {
  category: BudgetCategory;
  onBudgetChange: (categoryId: string, newBudget: number) => void;
  items: BudgetItem[];
  onRemoveItem: (itemId: string) => void;
}

function CategoryCard({ category, onBudgetChange, items, onRemoveItem }: CategoryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [budgetValue, setBudgetValue] = useState(category.budgeted);

  const percentage = category.budgeted > 0 ? (category.actual / category.budgeted) * 100 : 0;
  const isOverBudget = category.actual > category.budgeted;

  const handleSaveBudget = () => {
    onBudgetChange(category.id, budgetValue);
    setIsEditing(false);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${category.color}`}>
              <span className="text-lg">{category.icon}</span>
            </div>
            <div>
              <h4 className="font-medium">{category.name}</h4>
              <div className="text-sm text-muted-foreground">
                {category.actual.toFixed(2)} / {category.budgeted.toFixed(2)} {category.currency}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOverBudget ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
            
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={budgetValue}
                  onChange={(e) => setBudgetValue(parseFloat(e.target.value) || 0)}
                  className="w-24 h-8"
                />
                <Button size="sm" onClick={handleSaveBudget}>
                  <CheckCircle className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <Progress 
          value={Math.min(percentage, 100)} 
          className={`h-2 mb-2 ${isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`}
        />
        
        <div className="flex justify-between text-xs text-muted-foreground mb-3">
          <span>%{percentage.toFixed(1)} kullanıldı</span>
          <span className={isOverBudget ? 'text-red-600' : 'text-green-600'}>
            {isOverBudget ? '+' : ''}{(category.actual - category.budgeted).toFixed(2)} {category.currency}
          </span>
        </div>

        {/* Budget Items */}
        {items.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Harcamalar:</h5>
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                <div>
                  <span className="font-medium">{item.name}</span>
                  {item.isEstimate && (
                    <Badge variant="outline" className="ml-2 text-xs">Tahmini</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span>{item.amount} {item.currency}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AddBudgetItemModalProps {
  categories: BudgetCategory[];
  onSave: (item: Omit<BudgetItem, 'id'>) => void;
  onCancel: () => void;
  currency: string;
}

function AddBudgetItemModal({ categories, onSave, onCancel, currency }: AddBudgetItemModalProps) {
  const [itemData, setItemData] = useState({
    categoryId: '',
    name: '',
    amount: 0,
    currency,
    notes: '',
    isEstimate: false,
  });

  const handleSave = () => {
    if (!itemData.categoryId || !itemData.name || itemData.amount <= 0) {
      toast.error('Lütfen gerekli alanları doldurun.');
      return;
    }
    onSave(itemData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Harcama Ekle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="category">Kategori *</Label>
            <Select value={itemData.categoryId} onValueChange={(value) => 
              setItemData(prev => ({ ...prev, categoryId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="item-name">Harcama Adı *</Label>
            <Input
              id="item-name"
              placeholder="Örn: Havalimanı taksisi"
              value={itemData.name}
              onChange={(e) => setItemData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="amount">Tutar *</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={itemData.amount}
                onChange={(e) => setItemData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="flex-1"
              />
              <div className="w-20 flex items-center justify-center border rounded-md bg-muted text-sm">
                {currency}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notlar</Label>
            <Input
              id="notes"
              placeholder="Ek bilgiler..."
              value={itemData.notes}
              onChange={(e) => setItemData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="is-estimate"
              type="checkbox"
              checked={itemData.isEstimate}
              onChange={(e) => setItemData(prev => ({ ...prev, isEstimate: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="is-estimate" className="text-sm">
              Bu bir tahmini değer
            </Label>
          </div>
        </CardContent>
        
        <div className="p-6 border-t flex justify-end gap-4">
          <Button variant="outline" onClick={onCancel}>
            İptal
          </Button>
          <Button onClick={handleSave}>
            Kaydet
          </Button>
        </div>
      </Card>
    </div>
  );
}
