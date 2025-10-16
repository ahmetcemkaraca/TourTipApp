import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ana Sayfa',
  description: 'TourTrip ile Türkiye\'nin en güzel yerlerini keşfedin. Binlerce tur seçeneği, güvenli rezervasyon sistemi.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
            Türkiye'nin En Güzel Yerlerini Keşfedin
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Binlerce tur seçeneği, güvenli rezervasyon sistemi ve unutulmaz deneyimler için TourTrip ile tanışın.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Nereye gitmek istiyorsunuz?</label>
                <input
                  type="text"
                  placeholder="Şehir, bölge veya aktivite arayın..."
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tarih</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Kişi Sayısı</label>
                <select className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>1 Kişi</option>
                  <option>2 Kişi</option>
                  <option>3-5 Kişi</option>
                  <option>6+ Kişi</option>
                </select>
              </div>
            </div>
            <button className="w-full md:w-auto mt-4 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Tur Ara
            </button>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popüler Kategoriler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { name: 'Kültür Turları', icon: '🏛️', count: '150+ tur' },
              { name: 'Doğa & Macera', icon: '🏔️', count: '200+ tur' },
              { name: 'Şehir Turları', icon: '🏙️', count: '180+ tur' },
              { name: 'Gastromi', icon: '🍽️', count: '80+ tur' },
              { name: 'Deniz & Plaj', icon: '🏖️', count: '120+ tur' },
              { name: 'Kış Sporları', icon: '⛷️', count: '60+ tur' },
            ].map((category, index) => (
              <div key={index} className="bg-background rounded-lg p-6 text-center card-hover cursor-pointer">
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-semibold mb-1">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tours */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Öne Çıkan Turlar</h2>
            <button className="text-primary hover:text-primary/80 font-medium">
              Tümünü Gör →
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Featured tours will be loaded from Firestore */}
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-background rounded-lg shadow-sm border card-hover">
                <div className="aspect-[4/3] bg-muted rounded-t-lg mb-4"></div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold line-clamp-2">Kapadokya Balon Turu</h3>
                    <div className="flex items-center text-yellow-500">
                      <span className="text-sm">★ 4.8</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    Dünya'nın en güzel manzaralarından birini gökyüzünden izleyin.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">₺899</span>
                    <span className="text-sm text-muted-foreground">kişi başı</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Neden TourTrip?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🛡️',
                title: 'Güvenli Ödeme',
                description: 'SSL sertifikası ile korunan güvenli ödeme sistemi'
              },
              {
                icon: '⭐',
                title: 'Kalite Garantisi',
                description: 'Deneyimli rehberler ve kaliteli hizmet garantisi'
              },
              {
                icon: '📞',
                title: '7/24 Destek',
                description: 'Her zaman yanınızda olan müşteri destek ekibi'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
