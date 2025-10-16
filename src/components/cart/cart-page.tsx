'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Breadcrumb, breadcrumbs } from '@/components/layout/breadcrumb';
import { useCart } from './cart-provider';
import { cartService } from '@/lib/cart-service';
import { CartItem } from '@/lib/firestore-collections';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Calendar, 
  Users, 
  Clock, 
  MapPin,
  AlertTriangle,
  ShoppingBag,
  ArrowRight,
  Shield,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

export function CartPage() {
  const { cartItems, cartTotals, loading, updateCartItem, removeFromCart, clearCart } = useCart();
  const [selectedItems, setSelectedItems] = useState<string[]>(cartItems.map(item => item.id));
  const [promoCode, setPromoCode] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Update selected items when cart changes
  useState(() => {
    setSelectedItems(cartItems.map(item => item.id));
  });

  // Format price
  const formatPrice = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Handle item selection
  const handleItemSelection = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => 
      checked 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? cartItems.map(item => item.id) : []);
  };

  // Handle quantity change
  const handleQuantityChange = async (item: CartItem, type: 'adults' | 'children', newValue: number) => {
    try {
      const newParticipants = {
        ...item.participants,
        [type]: Math.max(0, newValue),
      };

      // Recalculate pricing
      const totalParticipants = newParticipants.adults + newParticipants.children;
      const newPricing = {
        ...item.pricing,
        totalPrice: item.pricing.basePrice * totalParticipants + item.pricing.addOnsTotal + item.pricing.insuranceTotal,
      };

      await updateCartItem(item.id, {
        participants: newParticipants,
        pricing: newPricing,
      });
    } catch (error) {
      toast.error('Miktar güncellenirken hata oluştu.');
    }
  };

  // Handle remove item
  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId);
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    } catch (error) {
      toast.error('Ürün çıkarılırken hata oluştu.');
    }
  };

  // Handle clear selected
  const handleClearSelected = async () => {
    try {
      await Promise.all(selectedItems.map(id => removeFromCart(id)));
      setSelectedItems([]);
      toast.success('Seçilen ürünler sepetten çıkarıldı.');
    } catch (error) {
      toast.error('Ürünler çıkarılırken hata oluştu.');
    }
  };

  // Handle promo code
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;

    setIsValidatingPromo(true);
    
    try {
      // Mock promo code validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, accept 'WELCOME10' as 10% discount
      if (promoCode.toUpperCase() === 'WELCOME10') {
        toast.success('Promosyon kodu uygulandı! %10 indirim');
      } else {
        toast.error('Geçersiz promosyon kodu.');
      }
    } catch (error) {
      toast.error('Promosyon kodu uygulanırken hata oluştu.');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Calculate selected items totals
  const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.id));
  const selectedTotals = cartService.calculateCartTotals(selectedCartItems);

  // Check for expired items
  const expiredItems = cartItems.filter(item => new Date(item.expiresAt) <= new Date());
  const hasExpiredItems = expiredItems.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[
            { label: 'Ana Sayfa', href: '/' },
            { label: 'Sepetim', current: true },
          ]} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Sepetim</h1>
              <p className="text-muted-foreground">
                {cartItems.length} ürün sepetinizde
              </p>
            </div>
          </div>

          {cartItems.length > 0 && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleClearSelected}
                disabled={selectedItems.length === 0}
              >
                Seçilenleri Çıkar ({selectedItems.length})
              </Button>
              <Button 
                variant="outline" 
                onClick={clearCart}
              >
                Sepeti Temizle
              </Button>
            </div>
          )}
        </div>

        {/* Empty Cart */}
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 mx-auto mb-6 text-muted-foreground/50" />
            <h2 className="text-2xl font-semibold mb-4">Sepetiniz boş</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Henüz sepetinize tur eklemediniz. Harika turları keşfetmek için turlar sayfasını ziyaret edin.
            </p>
            <Link href="/tours">
              <Button size="lg">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Turları Keşfet
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Expired Items Warning */}
              {hasExpiredItems && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">
                        {expiredItems.length} ürününüzün süresi dolmuş
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      Bu ürünler için tekrar rezervasyon yapmanız gerekiyor.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Select All */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedItems.length === cartItems.length}
                        onCheckedChange={(checked) => handleSelectAll(checked === true)}
                      />
                      <Label className="font-medium">
                        Tümünü seç ({cartItems.length} ürün)
                      </Label>
                    </div>
                    
                    <Badge variant="secondary">
                      {selectedItems.length} seçili
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Cart Items List */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.includes(item.id)}
                    onSelectionChange={(checked) => handleItemSelection(item.id, checked)}
                    onQuantityChange={handleQuantityChange}
                    onRemove={() => handleRemoveItem(item.id)}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-4">
                {/* Promo Code */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Promosyon Kodu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Promosyon kodunuz"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyPromoCode()}
                      />
                      <Button 
                        variant="outline" 
                        onClick={handleApplyPromoCode}
                        disabled={isValidatingPromo || !promoCode.trim()}
                      >
                        {isValidatingPromo ? 'Kontrol...' : 'Uygula'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Sipariş Özeti
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Ara Toplam ({selectedItems.length} ürün)</span>
                      <span>{formatPrice(selectedTotals.subtotal, selectedTotals.currency)}</span>
                    </div>
                    
                    {selectedTotals.addOnsTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Ek Hizmetler</span>
                        <span>{formatPrice(selectedTotals.addOnsTotal, selectedTotals.currency)}</span>
                      </div>
                    )}
                    
                    {selectedTotals.insuranceTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Sigorta</span>
                        <span>{formatPrice(selectedTotals.insuranceTotal, selectedTotals.currency)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Vergiler</span>
                      <span>{formatPrice(selectedTotals.taxTotal, selectedTotals.currency)}</span>
                    </div>
                    
                    {selectedTotals.discountTotal > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>İndirim</span>
                        <span>-{formatPrice(selectedTotals.discountTotal, selectedTotals.currency)}</span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between font-semibold">
                      <span>Toplam</span>
                      <span className="text-primary">
                        {formatPrice(selectedTotals.grandTotal, selectedTotals.currency)}
                      </span>
                    </div>

                    <div className="pt-4">
                      <Link href="/checkout">
                        <Button 
                          size="lg" 
                          className="w-full"
                          disabled={selectedItems.length === 0}
                        >
                          Ödemeye Geç
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Güvenli SSL şifreli ödeme</p>
                      <p>• 24 saat ücretsiz iptal hakkı</p>
                      <p>• Anında rezervasyon onayı</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CartItemRowProps {
  item: CartItem;
  isSelected: boolean;
  onSelectionChange: (checked: boolean) => void;
  onQuantityChange: (item: CartItem, type: 'adults' | 'children', newValue: number) => void;
  onRemove: () => void;
  formatPrice: (amount: number, currency: string) => string;
  formatDate: (dateString: string) => string;
}

function CartItemRow({ 
  item, 
  isSelected, 
  onSelectionChange, 
  onQuantityChange, 
  onRemove, 
  formatPrice, 
  formatDate 
}: CartItemRowProps) {
  const isExpired = new Date(item.expiresAt) <= new Date();
  const totalParticipants = item.participants.adults + item.participants.children;

  return (
    <Card className={`${isExpired ? 'opacity-60 border-amber-200' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Selection Checkbox */}
          <div className="flex items-start pt-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelectionChange}
              disabled={isExpired}
            />
          </div>

          {/* Tour Image */}
          <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src="/placeholder-tour.jpg" // TODO: Get actual tour image
              alt="Tour"
              fill
              className="object-cover"
            />
            {isExpired && (
              <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                <span className="text-xs font-medium text-white">Süresi Doldu</span>
              </div>
            )}
            {item.status === 'reserved' && (
              <div className="absolute inset-0 bg-amber-500/80 flex items-center justify-center">
                <span className="text-xs font-medium text-white">Rezerve</span>
              </div>
            )}
          </div>

          {/* Tour Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold line-clamp-1 mb-1">
                  Tur Başlığı {/* TODO: Get actual tour title */}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(item.selectedDate)}</span>
                  </div>
                  {item.timeSlot && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{item.timeSlot}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Participants */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Yetişkin:</Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onQuantityChange(item, 'adults', item.participants.adults - 1)}
                    disabled={item.participants.adults <= 1 || isExpired}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.participants.adults}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onQuantityChange(item, 'adults', item.participants.adults + 1)}
                    disabled={isExpired}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm">Çocuk:</Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onQuantityChange(item, 'children', item.participants.children - 1)}
                    disabled={item.participants.children <= 0 || isExpired}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.participants.children}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onQuantityChange(item, 'children', item.participants.children + 1)}
                    disabled={isExpired}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Add-ons */}
            {item.addOns.length > 0 && (
              <div className="mb-3">
                <Label className="text-sm text-muted-foreground">Ek Hizmetler:</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.addOns.map((addOn, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {addOn.name} {addOn.quantity > 1 && `(×${addOn.quantity})`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Insurance */}
            {item.insurance && (
              <div className="mb-3">
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Sigorta Dahil
                </Badge>
              </div>
            )}

            {/* Price */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {totalParticipants} kişi için toplam
              </div>
              <div className="font-semibold text-primary">
                {formatPrice(item.pricing.totalPrice, item.pricing.currency)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
