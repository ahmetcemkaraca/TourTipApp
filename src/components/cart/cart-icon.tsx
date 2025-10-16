'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useCart } from './cart-provider';
import { CartDropdown } from './cart-dropdown';
import { ShoppingCart } from 'lucide-react';

export function CartIcon() {
  const { cartCount, cartTotals } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  // Format price
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {cartCount > 99 ? '99+' : cartCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Sepetim</span>
          {cartCount > 0 && (
            <Badge variant="secondary">
              {cartCount} ürün
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {cartCount === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sepetiniz boş</p>
            <Link href="/tours">
              <Button variant="outline" size="sm" className="mt-2">
                Turları Keşfet
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <CartDropdown onClose={() => setIsOpen(false)} />
            
            <DropdownMenuSeparator />
            
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium">Toplam:</span>
                <span className="font-bold text-primary">
                  {formatPrice(cartTotals.grandTotal, cartTotals.currency)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Link href="/cart">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    Sepeti Görüntüle
                  </Button>
                </Link>
                <Link href="/checkout">
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    Ödemeye Geç
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
