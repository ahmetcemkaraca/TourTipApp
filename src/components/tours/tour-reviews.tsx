'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Star, ThumbsUp, Flag, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  helpful: number;
  createdAt: Date;
  verified: boolean;
}

interface TourReviewsProps {
  tourId: string;
}

export function TourReviews({ tourId }: TourReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'helpful' | 'rating'>('newest');

  // Mock reviews data - In real app, fetch from Firestore
  useEffect(() => {
    // TODO: Load real reviews from Firestore
    const reviews: Review[] = [
      {
        id: '1',
        userId: 'user1',
        userName: 'Ahmet Kaya',
        userAvatar: '',
        rating: 5,
        title: 'Muhteşem bir deneyimdi!',
        content: 'Kapadokya balon turu gerçekten unutulmaz bir deneyimdi. Rehberimiz çok bilgiliydi ve manzara nefes kesiciydi. Herkese tavsiye ederim.',
        images: [],
        helpful: 12,
        createdAt: new Date('2024-01-15'),
        verified: true,
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Elif Demir',
        userAvatar: '',
        rating: 4,
        title: 'Güzel bir tur',
        content: 'Genel olarak memnun kaldık. Sadece bekleme süresi biraz uzundu. Ama manzara gerçekten güzeldi.',
        images: [],
        helpful: 8,
        createdAt: new Date('2024-01-10'),
        verified: true,
      },
      {
        id: '3',
        userId: 'user3',
        userName: 'Mehmet Öz',
        userAvatar: '',
        rating: 5,
        title: 'Harika organizasyon',
        content: 'Her şey çok düzenliydi. Saatinde başladık, rehber çok iyiydi. Fotoğraflar mükemmel çıktı.',
        images: [],
        helpful: 15,
        createdAt: new Date('2024-01-05'),
        verified: false,
      },
    ];

    // Simulate API call
    setTimeout(() => {
      // TODO: Load from Firestore
    setReviews([]);
      setLoading(false);
    }, 1000);
  }, [tourId]);

  // Calculate rating statistics
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(rating => 
    reviews.filter(review => review.rating === rating).length
  );

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'helpful':
        return b.helpful - a.helpful;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  // Render star rating
  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating 
                ? 'fill-yellow-500 text-yellow-500' 
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-20"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Değerlendirmeler ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
              {renderStars(Math.round(averageRating))}
              <p className="text-sm text-muted-foreground mt-2">
                {reviews.length} değerlendirme
              </p>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating, index) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm w-4">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <Progress 
                    value={reviews.length > 0 ? (ratingCounts[index] / reviews.length) * 100 : 0}
                    className="flex-1 h-2"
                  />
                  <span className="text-sm text-muted-foreground w-8">
                    {ratingCounts[index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Yorumlar</CardTitle>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border rounded px-3 py-1"
            >
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
              <option value="helpful">En Yararlı</option>
              <option value="rating">En Yüksek Puan</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {sortedReviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Henüz değerlendirme yapılmamış.</p>
              <Button variant="outline" className="mt-4">
                İlk Değerlendirmeyi Yapın
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedReviews.map((review, index) => (
                <div key={review.id}>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={review.userAvatar} alt={review.userName} />
                      <AvatarFallback>
                        {review.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      {/* User Info */}
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{review.userName}</h4>
                        {review.verified && (
                          <Badge variant="outline" className="text-xs">
                            Doğrulanmış
                          </Badge>
                        )}
                      </div>

                      {/* Rating and Date */}
                      <div className="flex items-center gap-3">
                        {renderStars(review.rating, 'sm')}
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(review.createdAt), { 
                            addSuffix: true, 
                            locale: tr 
                          })}
                        </span>
                      </div>

                      {/* Review Content */}
                      <div>
                        <h5 className="font-medium mb-1">{review.title}</h5>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.content}
                        </p>
                      </div>

                      {/* Review Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {review.images.map((image, imgIndex) => (
                            <div key={imgIndex} className="w-16 h-16 rounded-lg overflow-hidden">
                              <img 
                                src={image} 
                                alt={`Review image ${imgIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Review Actions */}
                      <div className="flex items-center gap-4 pt-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Yararlı ({review.helpful})
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Flag className="h-3 w-3 mr-1" />
                          Bildir
                        </Button>
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  {index < sortedReviews.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Write Review Button */}
      <div className="text-center">
        <Button size="lg">
          Değerlendirme Yaz
        </Button>
      </div>
    </div>
  );
}
