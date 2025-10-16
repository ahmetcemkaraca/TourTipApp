export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Yükleniyor...</h2>
        <p className="text-muted-foreground">Sayfanız hazırlanıyor.</p>
      </div>
    </div>
  );
}
