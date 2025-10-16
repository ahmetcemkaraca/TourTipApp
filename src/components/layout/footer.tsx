import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  CreditCard,
  Shield,
  Award
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const companyLinks = [
    { name: 'Hakkımızda', href: '/about' },
    { name: 'Kariyer', href: '/careers' },
    { name: 'Basın', href: '/press' },
    { name: 'İletişim', href: '/contact' },
    { name: 'Blog', href: '/blog' },
  ];

  const supportLinks = [
    { name: 'Yardım Merkezi', href: '/help' },
    { name: 'Güvenlik', href: '/safety' },
    { name: 'İptal ve İade', href: '/cancellation' },
    { name: 'Sıkça Sorulan Sorular', href: '/faq' },
    { name: 'İletişim', href: '/support' },
  ];

  const serviceLinks = [
    { name: 'Turlar', href: '/tours' },
    { name: 'Gezi Planlayıcı', href: '/trip-planner' },
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'Partner Ol', href: '/become-partner' },
    { name: 'Hediye Kartları', href: '/gift-cards' },
  ];

  const legalLinks = [
    { name: 'Kullanım Şartları', href: '/terms' },
    { name: 'Gizlilik Politikası', href: '/privacy' },
    { name: 'Çerez Politikası', href: '/cookies' },
    { name: 'KVKK', href: '/kvkk' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/tourtrip' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/tourtrip' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/tourtrip' },
    { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/tourtrip' },
  ];

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4">
        {/* Newsletter Section */}
        <div className="py-12 text-center">
          <h3 className="text-2xl font-bold mb-2">En İyi Fırsatları Kaçırmayın!</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Özel indirimler, yeni turlar ve seyahat ipuçları için bültenimize abone olun.
          </p>
          <div className="flex max-w-sm mx-auto space-x-2">
            <Input 
              type="email" 
              placeholder="E-posta adresiniz" 
              className="flex-1"
            />
            <Button type="submit">
              Abone Ol
            </Button>
          </div>
        </div>

        <Separator className="mb-12" />

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">T</span>
              </div>
              <span className="font-bold text-xl text-primary">TourTrip</span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-md">
              Türkiye'nin en büyük tur ve aktivite rezervasyon platformu. 
              Unutulmaz deneyimler için güvenilir adresiniz.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+90 212 123 45 67</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>info@tourtrip.app</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>İstanbul, Türkiye</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Button key={social.name} variant="ghost" size="icon" asChild>
                    <Link href={social.href} target="_blank" rel="noopener noreferrer">
                      <Icon className="h-5 w-5" />
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Şirket</h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Destek</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Links */}
          <div>
            <h4 className="font-semibold mb-4">Hizmetler</h4>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Trust Indicators */}
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Güvenli Ödeme</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Award className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Kalite Garantisi</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Ücretsiz İptal</span>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Bottom Footer */}
        <div className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © {currentYear} TourTrip.app. Tüm hakları saklıdır.
            </div>
            
            {/* Legal Links */}
            <div className="flex flex-wrap justify-center space-x-4">
              {legalLinks.map((link, index) => (
                <span key={link.name} className="flex items-center">
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                  {index < legalLinks.length - 1 && (
                    <span className="ml-4 text-muted-foreground">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
