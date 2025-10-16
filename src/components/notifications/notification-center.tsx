'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, X, Eye, Trash2, Settings, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useUserNotifications } from '@/hooks/use-realtime';
import { notificationService } from '@/lib/notification-service';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const { notifications, unreadCount, loading } = useUserNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'booking' | 'payment' | 'promotion' | 'system' | 'reminder'>('all');
  const [isOpen, setIsOpen] = useState(false);

  const filteredNotifications = notifications.filter(notification => {
    const statusMatch = filter === 'all' || 
      (filter === 'unread' && notification.status === 'unread') ||
      (filter === 'read' && notification.status === 'read');
    
    const typeMatch = typeFilter === 'all' || notification.type === typeFilter;
    
    return statusMatch && typeMatch;
  });

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead('current-user-id'); // TODO: Get from auth context
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      booking: '📅',
      payment: '💳',
      promotion: '🎉',
      system: '⚙️',
      reminder: '⏰',
    };
    return icons[type as keyof typeof icons] || '📢';
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'border-red-500 bg-red-50';
    if (priority === 'high') return 'border-orange-500 bg-orange-50';
    
    const colors = {
      booking: 'border-blue-500 bg-blue-50',
      payment: 'border-green-500 bg-green-50',
      promotion: 'border-purple-500 bg-purple-50',
      system: 'border-gray-500 bg-gray-50',
      reminder: 'border-yellow-500 bg-yellow-50',
    };
    return colors[type as keyof typeof colors] || 'border-gray-300 bg-gray-50';
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:w-[400px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Bildirimler
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} okunmamış</Badge>
                )}
              </SheetTitle>
              
              <div className="flex gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilter('all')}>
                      Tümü
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('unread')}>
                      Okunmamış
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('read')}>
                      Okunmuş
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleMarkAllAsRead}>
                      <Check className="h-4 w-4 mr-2" />
                      Tümünü Okundu İşaretle
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Bildirim Ayarları
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tür filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Türler</SelectItem>
                  <SelectItem value="booking">Rezervasyon</SelectItem>
                  <SelectItem value="payment">Ödeme</SelectItem>
                  <SelectItem value="promotion">Promosyon</SelectItem>
                  <SelectItem value="system">Sistem</SelectItem>
                  <SelectItem value="reminder">Hatırlatma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SheetHeader>

          <Separator />

          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Bildirim Bulunamadı</h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'unread' 
                    ? 'Okunmamış bildiriminiz bulunmuyor.'
                    : 'Henüz hiç bildiriminiz yok.'
                  }
                </p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-2 space-y-2">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDeleteNotification}
                      getNotificationIcon={getNotificationIcon}
                      getNotificationColor={getNotificationColor}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface NotificationItemProps {
  notification: any;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getNotificationIcon: (type: string) => string;
  getNotificationColor: (type: string, priority: string) => string;
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  getNotificationIcon, 
  getNotificationColor 
}: NotificationItemProps) {
  const isUnread = notification.status === 'unread';
  const icon = getNotificationIcon(notification.type);
  const colorClass = getNotificationColor(notification.type, notification.priority);

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-sm ${
        isUnread ? 'bg-blue-50 border-blue-200' : 'bg-white'
      } ${colorClass}`}
    >
      <CardContent className="p-3">
        <div className="flex gap-3">
          <div className="text-2xl flex-shrink-0 mt-0.5">
            {icon}
          </div>
          
          <div className="flex-1 min-w-0" onClick={handleClick}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className={`text-sm line-clamp-1 ${
                isUnread ? 'font-semibold' : 'font-medium'
              }`}>
                {notification.title}
              </h4>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                {notification.priority === 'urgent' && (
                  <Badge variant="destructive" className="text-xs px-1 py-0">
                    Acil
                  </Badge>
                )}
                {notification.priority === 'high' && (
                  <Badge variant="default" className="text-xs px-1 py-0">
                    Önemli
                  </Badge>
                )}
                {isUnread && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt.seconds * 1000), {
                  addSuffix: true,
                  locale: tr
                })}
              </span>
              
              <div className="flex gap-1">
                {isUnread && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notification.id);
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
