'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Search, MapPin, Heart, Star, Home, MessageCircle, User, Calendar, Wifi, Car, Wind,
  Bath, Bed, Coffee, Shield, ArrowLeft, Send, Check, CreditCard, ChevronDown, X, SlidersHorizontal,
  TrendingUp, Award, Zap, Users, Clock, Plus, Settings, Bell, ChevronRight, Edit3, FileText,
  HelpCircle, LogOut, Sparkles, Eye, LayoutDashboard, Building2, DollarSign, BarChart3, Trash2,
  CheckCircle, XCircle, AlertCircle, UserCheck, Activity, Upload, MoreVertical, ArrowUpRight,
  Crown, ShieldCheck, Ban, FileBarChart, Wallet, Phone, Share2
} from 'lucide-react';

const CITIES = ['Semua Kota', 'Jakarta Selatan', 'Jakarta Pusat', 'Yogyakarta', 'Bandung', 'Surabaya', 'Malang'];
const TYPES = ['Semua', 'Putra', 'Putri', 'Campur'];
const FACILITY_ICONS: any = {
  'WiFi': Wifi, 'AC': Wind, 'Kamar Mandi Dalam': Bath, 'Kasur': Bed,
  'Lemari': Home, 'Parkir Motor': Car, 'Parkir Mobil': Car,
  'Meja Kerja': Edit3, 'Dapur Bersama': Coffee
};
const formatRupiah = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;
const formatShort = (n: number) => {
  if (!n) return 'Rp 0';
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1)}jt`;
  if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)}rb`;
  return `Rp ${n}`;
};

export default function MainApp({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [page, setPage] = useState(user.role === 'owner' ? 'ownerDashboard' : user.role === 'admin' ? 'adminDashboard' : 'home');
  const [selectedKos, setSelectedKos] = useState<any>(null);
  const [kosList, setKosList] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ city: 'Semua Kota', type: 'Semua', minPrice: 0, maxPrice: 5000000, facilities: [] as string[] });
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: kosData } = await supabase.from('kos').select('*, kos_images(image_url, display_order)').order('rating', { ascending: false });
    if (kosData) {
      const processed = kosData.map((k: any) => ({
        ...k,
        images: (k.kos_images || []).sort((a: any, b: any) => a.display_order - b.display_order).map((i: any) => i.image_url),
        image: (k.kos_images || []).sort((a: any, b: any) => a.display_order - b.display_order)[0]?.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
      }));
      setKosList(processed);
    }

    if (user.role === 'tenant') {
      const { data: wl } = await supabase.from('wishlists').select('kos_id').eq('user_id', user.id);
      if (wl) setWishlist(wl.map((w: any) => w.kos_id));
    }

    const { data: bk } = await supabase.from('bookings').select('*, profiles!user_id(full_name, phone)').order('created_at', { ascending: false });
    if (bk) {
      setBookings(bk.map((b: any) => ({
        ...b,
        userName: b.profiles?.full_name || 'User',
        userPhone: b.profiles?.phone || '-',
        duration: b.duration_months,
        total: b.total_amount,
        moveInDate: b.move_in_date,
        kosId: b.kos_id
      })));
    }

    setLoading(false);
  };

  const toggleWishlist = async (id: string) => {
    if (wishlist.includes(id)) {
      setWishlist(prev => prev.filter(x => x !== id));
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('kos_id', id);
    } else {
      setWishlist(prev => [...prev, id]);
      await supabase.from('wishlists').insert({ user_id: user.id, kos_id: id });
    }
  };

  const navigateTo = (newPage: string, kos: any = null) => {
    if (kos) setSelectedKos(kos);
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  const filteredKos = useMemo(() => {
    return kosList.filter((k: any) => {
      if (k.status !== 'active') return false;
      if (searchQuery && !k.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !k.area.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !k.city.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.city !== 'Semua Kota' && k.city !== filters.city) return false;
      if (filters.type !== 'Semua' && k.type !== filters.type) return false;
      if (k.price_monthly < filters.minPrice || k.price_monthly > filters.maxPrice) return false;
      if (filters.facilities.length > 0 && !filters.facilities.every(f => k.facilities?.includes(f))) return false;
      return true;
    });
  }, [searchQuery, filters, kosList]);

  const activeKos = useMemo(() => kosList.filter(k => k.status === 'active'), [kosList]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-green-700 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* TENANT PAGES */}
      {user.role === 'tenant' && (
        <>
          {page === 'home' && <HomePage kosData={activeKos} wishlist={wishlist} toggleWishlist={toggleWishlist} navigateTo={navigateTo} setFilters={setFilters} />}
          {page === 'search' && <SearchPage kosData={filteredKos} wishlist={wishlist} toggleWishlist={toggleWishlist} navigateTo={navigateTo} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filters={filters} setFilters={setFilters} showFilter={showFilter} setShowFilter={setShowFilter} />}
          {page === 'detail' && selectedKos && <DetailPage kos={selectedKos} wishlist={wishlist} toggleWishlist={toggleWishlist} navigateTo={navigateTo} />}
          {page === 'booking' && selectedKos && <BookingPage kos={selectedKos} navigateTo={navigateTo} user={user} supabase={supabase} onSuccess={loadData} />}
          {page === 'success' && selectedKos && <SuccessPage kos={selectedKos} navigateTo={navigateTo} />}
          {page === 'wishlist' && <WishlistPage wishlist={wishlist} kosData={activeKos} toggleWishlist={toggleWishlist} navigateTo={navigateTo} />}
          {page === 'chat' && <ChatPage navigateTo={navigateTo} kosData={activeKos} />}
          {page === 'chatRoom' && selectedKos && <ChatRoomPage kos={selectedKos} navigateTo={navigateTo} user={user} />}
          {page === 'profile' && <ProfilePage navigateTo={navigateTo} user={user} bookings={bookings.filter(b => b.user_id === user.id)} onLogout={onLogout} />}
          {page === 'bookings' && <MyBookingsPage bookings={bookings.filter(b => b.user_id === user.id)} kosData={kosList} navigateTo={navigateTo} />}

          {!['detail', 'booking', 'success', 'chatRoom'].includes(page) && (
            <BottomNav page={page} navigateTo={navigateTo} wishlistCount={wishlist.length} role="tenant" />
          )}
        </>
      )}

      {/* OWNER PAGES */}
      {user.role === 'owner' && (
        <>
          {page === 'ownerDashboard' && <OwnerDashboard user={user} kosList={kosList} bookings={bookings} navigateTo={navigateTo} />}
          {page === 'ownerKos' && <OwnerKosList user={user} kosList={kosList} navigateTo={navigateTo} />}
          {page === 'ownerAddKos' && <OwnerAddKos user={user} navigateTo={navigateTo} editingKos={selectedKos} supabase={supabase} onSuccess={loadData} />}
          {page === 'ownerKosDetail' && selectedKos && <OwnerKosDetail kos={selectedKos} bookings={bookings} navigateTo={navigateTo} supabase={supabase} onUpdate={loadData} />}
          {page === 'ownerBookings' && <OwnerBookings user={user} kosList={kosList} bookings={bookings} supabase={supabase} onUpdate={loadData} />}
          {page === 'ownerProfile' && <OwnerProfile user={user} navigateTo={navigateTo} onLogout={onLogout} kosList={kosList.filter(k => k.owner_id === user.id)} />}

          <BottomNav page={page} navigateTo={navigateTo} role="owner" pendingCount={bookings.filter(b => b.status === 'pending' && kosList.find(k => k.id === b.kosId)?.owner_id === user.id).length} />
        </>
      )}

      {/* ADMIN PAGES */}
      {user.role === 'admin' && (
        <>
          {page === 'adminDashboard' && <AdminDashboard kosList={kosList} bookings={bookings} navigateTo={navigateTo} />}
          {page === 'adminKos' && <AdminKosList kosList={kosList} navigateTo={navigateTo} />}
          {page === 'adminKosDetail' && selectedKos && <AdminKosDetail kos={selectedKos} supabase={supabase} navigateTo={navigateTo} onUpdate={loadData} />}
          {page === 'adminBookings' && <AdminBookings bookings={bookings} kosList={kosList} navigateTo={navigateTo} />}
          {page === 'adminReports' && <AdminReports kosList={kosList} bookings={bookings} navigateTo={navigateTo} />}
          {page === 'adminProfile' && <AdminProfile user={user} navigateTo={navigateTo} onLogout={onLogout} />}

          <BottomNav page={page} navigateTo={navigateTo} role="admin" pendingCount={kosList.filter(k => k.status === 'pending').length} />
        </>
      )}
    </div>
  );
}

// ============ TENANT COMPONENTS ============
function HomePage({ kosData, wishlist, toggleWishlist, navigateTo, setFilters }: any) {
  return (
    <div className="animate-fade-in">
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="relative px-5 pt-12 pb-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-green-100 mb-1">Selamat datang 👋</p>
              <h1 className="font-display text-2xl font-bold">Cari Kos Idaman</h1>
            </div>
            <button className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><Bell size={20} /></button>
          </div>
          <button onClick={() => navigateTo('search')} className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-lg text-left">
            <Search size={20} className="text-green-700" />
            <span className="text-stone-500 text-sm">Cari kos di area Anda...</span>
          </button>
        </div>
      </div>

      <div className="px-5 -mt-4 mb-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-md p-4 grid grid-cols-4 gap-2">
          {[
            { icon: Sparkles, label: 'Putri', color: 'bg-pink-100 text-pink-600', type: 'Putri' },
            { icon: Users, label: 'Putra', color: 'bg-blue-100 text-blue-600', type: 'Putra' },
            { icon: Home, label: 'Campur', color: 'bg-purple-100 text-purple-600', type: 'Campur' },
            { icon: Award, label: 'Premium', color: 'bg-amber-100 text-amber-600', type: 'Semua' },
          ].map(cat => (
            <button key={cat.label} onClick={() => { setFilters((prev: any) => ({ ...prev, type: cat.type })); navigateTo('search'); }} className="flex flex-col items-center gap-2 py-2 hover:bg-stone-50 rounded-xl">
              <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center`}><cat.icon size={22} /></div>
              <span className="text-xs font-medium text-stone-700">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mb-6">
        <div className="relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)' }}>
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10"></div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10"></div>
          <div className="relative">
            <span className="inline-block px-2 py-1 bg-white/25 backdrop-blur rounded-full text-xs font-bold mb-2">PROMO SPESIAL</span>
            <h3 className="font-display text-xl font-bold mb-1">Diskon hingga 25%</h3>
            <p className="text-sm text-orange-50">Untuk booking pertama bulan ini</p>
          </div>
        </div>
      </div>

      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><TrendingUp size={20} className="text-green-700" /><h2 className="font-display text-lg font-bold">Kos Populer</h2></div>
          <button onClick={() => navigateTo('search')} className="text-sm text-green-700 font-semibold">Lihat semua</button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
          {kosData.slice(0, 3).map((kos: any) => <PopularCard key={kos.id} kos={kos} wishlist={wishlist} toggleWishlist={toggleWishlist} navigateTo={navigateTo} />)}
        </div>
      </div>

      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-4"><Zap size={20} className="text-green-700" /><h2 className="font-display text-lg font-bold">Rekomendasi</h2></div>
        <div className="space-y-3">
          {kosData.slice(0, 4).map((kos: any) => <KosCard key={kos.id} kos={kos} wishlist={wishlist} toggleWishlist={toggleWishlist} navigateTo={navigateTo} />)}
        </div>
      </div>
    </div>
  );
}

function PopularCard({ kos, wishlist, toggleWishlist, navigateTo }: any) {
  return (
    <div onClick={() => navigateTo('detail', kos)} className="flex-shrink-0 w-64 bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 cursor-pointer">
      <div className="relative h-36">
        <img src={kos.image} alt={kos.name} className="w-full h-full object-cover" />
        <button onClick={(e) => { e.stopPropagation(); toggleWishlist(kos.id); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 backdrop-blur flex items-center justify-center">
          <Heart size={16} className={wishlist.includes(kos.id) ? 'fill-red-500 text-red-500' : 'text-stone-600'} />
        </button>
        {kos.promo_percent > 0 && <div className="absolute top-2 left-2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-md">-{kos.promo_percent}%</div>}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1 mb-1">
          <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-semibold rounded">{kos.type}</span>
          {kos.verified && <Check size={12} className="text-blue-500" />}
        </div>
        <h3 className="font-semibold text-sm line-clamp-1">{kos.name}</h3>
        <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
          <MapPin size={10} /><span className="line-clamp-1">{kos.area}, {kos.city}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div><p className="font-bold text-sm">{formatRupiah(kos.price_monthly)}</p><p className="text-[10px] text-stone-500">/bulan</p></div>
          <div className="flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /><span className="text-xs font-semibold">{kos.rating}</span></div>
        </div>
      </div>
    </div>
  );
}

function KosCard({ kos, wishlist, toggleWishlist, navigateTo }: any) {
  return (
    <div onClick={() => navigateTo('detail', kos)} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 cursor-pointer flex">
      <div className="relative w-32 h-32 flex-shrink-0">
        <img src={kos.image} alt={kos.name} className="w-full h-full object-cover" />
        {kos.promo_percent > 0 && <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded">-{kos.promo_percent}%</div>}
      </div>
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-semibold rounded">{kos.type}</span>
              {kos.verified && <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded"><Check size={10} /> Verified</div>}
            </div>
            <button onClick={(e) => { e.stopPropagation(); toggleWishlist(kos.id); }}>
              <Heart size={18} className={wishlist.includes(kos.id) ? 'fill-red-500 text-red-500' : 'text-stone-400'} />
            </button>
          </div>
          <h3 className="font-semibold text-sm line-clamp-1">{kos.name}</h3>
          <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
            <MapPin size={10} /><span className="line-clamp-1">{kos.area}, {kos.city}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Star size={11} className="fill-amber-400 text-amber-400" /><span className="text-xs font-semibold">{kos.rating}</span>
            <span className="text-[10px] text-stone-500">({kos.review_count})</span>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div><p className="font-bold text-sm">{formatRupiah(kos.price_monthly)}</p><p className="text-[10px] text-stone-500">per bulan</p></div>
          <span className="text-[10px] text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full">Sisa {kos.available_rooms}</span>
        </div>
      </div>
    </div>
  );
}

function SearchPage({ kosData, wishlist, toggleWishlist, navigateTo, searchQuery, setSearchQuery, filters, setFilters, showFilter, setShowFilter }: any) {
  return (
    <div className="animate-fade-in pb-4">
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100 px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigateTo('home')}><ArrowLeft size={22} /></button>
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari nama, area, kota..." className="w-full pl-10 pr-4 py-2.5 bg-stone-100 rounded-xl text-sm focus:outline-none" />
          </div>
          <button onClick={() => setShowFilter(true)} className="w-10 h-10 rounded-xl bg-green-700 text-white flex items-center justify-center"><SlidersHorizontal size={18} /></button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <div className="flex-shrink-0 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">{filters.city}</div>
          <div className="flex-shrink-0 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">{filters.type}</div>
          <div className="flex-shrink-0 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">&lt; {formatRupiah(filters.maxPrice)}</div>
        </div>
      </div>
      <div className="px-5 py-3"><p className="text-sm text-stone-600"><span className="font-bold">{kosData.length}</span> kos ditemukan</p></div>
      <div className="px-5 space-y-3">
        {kosData.length === 0 ? (
          <div className="text-center py-16">
            <Search size={48} className="mx-auto text-stone-300 mb-3" />
            <p className="font-semibold">Tidak ada hasil</p>
          </div>
        ) : kosData.map((kos: any) => <KosCard key={kos.id} kos={kos} wishlist={wishlist} toggleWishlist={toggleWishlist} navigateTo={navigateTo} />)}
      </div>
      {showFilter && <FilterModal filters={filters} setFilters={setFilters} onClose={() => setShowFilter(false)} />}
    </div>
  );
}

function FilterModal({ filters, setFilters, onClose }: any) {
  const [local, setLocal] = useState(filters);
  const allFacilities = ['WiFi', 'AC', 'Kamar Mandi Dalam', 'Parkir Motor', 'Parkir Mobil', 'Dapur Bersama'];
  const toggleFacility = (f: string) => setLocal((prev: any) => ({ ...prev, facilities: prev.facilities.includes(f) ? prev.facilities.filter((x: string) => x !== f) : [...prev.facilities, f] }));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6"><h3 className="font-display text-xl font-bold">Filter Kos</h3><button onClick={onClose}><X size={22} /></button></div>
        <div className="mb-6">
          <h4 className="font-semibold text-sm mb-3">Kota</h4>
          <div className="flex flex-wrap gap-2">{CITIES.map(c => <button key={c} onClick={() => setLocal((prev: any) => ({ ...prev, city: c }))} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${local.city === c ? 'bg-green-700 text-white' : 'bg-stone-100 text-stone-700'}`}>{c}</button>)}</div>
        </div>
        <div className="mb-6">
          <h4 className="font-semibold text-sm mb-3">Tipe Kos</h4>
          <div className="grid grid-cols-4 gap-2">{TYPES.map(t => <button key={t} onClick={() => setLocal((prev: any) => ({ ...prev, type: t }))} className={`py-2 rounded-xl text-xs font-semibold ${local.type === t ? 'bg-green-700 text-white' : 'bg-stone-100 text-stone-700'}`}>{t}</button>)}</div>
        </div>
        <div className="mb-6">
          <h4 className="font-semibold text-sm mb-3">Harga Maksimal</h4>
          <p className="text-2xl font-bold text-green-700 mb-2">{formatRupiah(local.maxPrice)}</p>
          <input type="range" min={500000} max={5000000} step={100000} value={local.maxPrice} onChange={e => setLocal((prev: any) => ({ ...prev, maxPrice: Number(e.target.value) }))} className="w-full accent-green-700" />
        </div>
        <div className="mb-6">
          <h4 className="font-semibold text-sm mb-3">Fasilitas</h4>
          <div className="grid grid-cols-2 gap-2">{allFacilities.map(f => {
            const Icon = FACILITY_ICONS[f] || Home;
            const active = local.facilities.includes(f);
            return <button key={f} onClick={() => toggleFacility(f)} className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${active ? 'bg-green-700 text-white' : 'bg-stone-100 text-stone-700'}`}><Icon size={16} />{f}</button>;
          })}</div>
        </div>
        <div className="flex gap-3 sticky bottom-0 bg-white pt-3">
          <button onClick={() => setLocal({ city: 'Semua Kota', type: 'Semua', minPrice: 0, maxPrice: 5000000, facilities: [] })} className="flex-1 py-3 rounded-xl border border-stone-200 font-semibold text-sm">Reset</button>
          <button onClick={() => { setFilters(local); onClose(); }} className="flex-1 py-3 rounded-xl bg-green-700 text-white font-semibold text-sm">Terapkan</button>
        </div>
      </div>
    </div>
  );
}

function DetailPage({ kos, wishlist, toggleWishlist, navigateTo }: any) {
  const [imgIdx, setImgIdx] = useState(0);
  return (
    <div className="animate-fade-in pb-24">
      <div className="relative h-72 bg-stone-200">
        <img src={kos.images[imgIdx] || kos.image} alt={kos.name} className="w-full h-full object-cover" />
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.4), transparent)' }}>
          <button onClick={() => navigateTo('search')} className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center"><ArrowLeft size={20} /></button>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center"><Share2 size={18} /></button>
            <button onClick={() => toggleWishlist(kos.id)} className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center"><Heart size={18} className={wishlist.includes(kos.id) ? 'fill-red-500 text-red-500' : ''} /></button>
          </div>
        </div>
      </div>
      <div className="px-5 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {kos.images.map((img: string, i: number) => <button key={i} onClick={() => setImgIdx(i)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${i === imgIdx ? 'border-green-700' : 'border-transparent'}`}><img src={img} alt="" className="w-full h-full object-cover" /></button>)}
      </div>
      <div className="px-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-bold rounded">{kos.type}</span>
          {kos.verified && <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded"><Check size={12} /> Verified</div>}
          {kos.promo_percent > 0 && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded">-{kos.promo_percent}%</span>}
        </div>
        <h1 className="font-display text-2xl font-bold leading-tight">{kos.name}</h1>
        <div className="flex items-center gap-1 mt-1 text-sm text-stone-600"><MapPin size={14} /><span>{kos.area}, {kos.city}</span></div>
        <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-2xl my-5">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400" /><span className="font-bold">{kos.rating}</span></div>
            <p className="text-[10px] text-stone-500 mt-0.5">{kos.review_count} ulasan</p>
          </div>
          <div className="text-center border-x border-stone-200"><p className="font-bold">{kos.available_rooms}</p><p className="text-[10px] text-stone-500 mt-0.5">Tersedia</p></div>
          <div className="text-center"><p className="font-bold text-xs">{kos.distance_info?.split(' ')[0]}</p><p className="text-[10px] text-stone-500 mt-0.5">{kos.distance_info?.split(' ').slice(1).join(' ')}</p></div>
        </div>
        <div className="mb-5"><h3 className="font-display text-lg font-bold mb-2">Tentang Kos</h3><p className="text-sm text-stone-600 leading-relaxed">{kos.description}</p></div>
        <div className="mb-5">
          <h3 className="font-display text-lg font-bold mb-3">Fasilitas</h3>
          <div className="grid grid-cols-3 gap-2">{(kos.facilities || []).map((f: string) => {
            const Icon = FACILITY_ICONS[f] || Home;
            return <div key={f} className="flex flex-col items-center gap-1 p-3 bg-stone-50 rounded-xl"><Icon size={20} className="text-green-700" /><span className="text-[10px] text-center font-medium">{f}</span></div>;
          })}</div>
        </div>
        <div className="mb-5">
          <h3 className="font-display text-lg font-bold mb-3">Peraturan</h3>
          <div className="space-y-2">{(kos.rules || []).map((r: string, i: number) => <div key={i} className="flex items-start gap-2"><Shield size={14} className="text-green-700 mt-0.5" /><span className="text-sm text-stone-600">{r}</span></div>)}</div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-stone-100 p-4 flex items-center gap-3">
        <div className="flex-1"><p className="text-[10px] text-stone-500">Mulai dari</p><p className="font-display font-bold text-xl">{formatRupiah(kos.price_monthly)}<span className="text-xs text-stone-500 font-normal">/bulan</span></p></div>
        <button onClick={() => navigateTo('booking', kos)} className="px-6 py-3 bg-green-700 text-white rounded-xl font-bold text-sm">Booking Sekarang</button>
      </div>
    </div>
  );
}

function BookingPage({ kos, navigateTo, user, supabase, onSuccess }: any) {
  const [duration, setDuration] = useState(1);
  const [moveInDate, setMoveInDate] = useState('');
  const [payment, setPayment] = useState('transfer');
  const [submitting, setSubmitting] = useState(false);
  const total = kos.price_monthly * duration;
  const discount = kos.promo_percent > 0 ? Math.round(total * kos.promo_percent / 100) : 0;
  const finalTotal = total - discount;

  const handleBooking = async () => {
    setSubmitting(true);
    const { error } = await supabase.from('bookings').insert({
      user_id: user.id, kos_id: kos.id, duration_months: duration,
      move_in_date: moveInDate, total_amount: finalTotal, payment_method: payment, status: 'pending'
    });
    if (!error) {
      await onSuccess();
      navigateTo('success', kos);
    } else {
      alert('Gagal: ' + error.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="animate-fade-in pb-32">
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100 px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigateTo('detail', kos)}><ArrowLeft size={22} /></button>
        <h1 className="font-display text-lg font-bold">Booking Kos</h1>
      </div>
      <div className="p-5">
        <div className="flex gap-3 p-3 bg-stone-50 rounded-2xl mb-5">
          <img src={kos.image} alt="" className="w-20 h-20 rounded-xl object-cover" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{kos.name}</p>
            <p className="text-xs text-stone-500 mt-0.5">{kos.area}, {kos.city}</p>
            <p className="font-bold text-sm text-green-700 mt-1">{formatRupiah(kos.price_monthly)}/bulan</p>
          </div>
        </div>
        <div className="mb-5">
          <label className="font-semibold text-sm mb-2 block">Tanggal Masuk</label>
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl text-sm focus:outline-none" />
          </div>
        </div>
        <div className="mb-5">
          <label className="font-semibold text-sm mb-2 block">Durasi Sewa</label>
          <div className="grid grid-cols-4 gap-2">{[1, 3, 6, 12].map(m => <button key={m} onClick={() => setDuration(m)} className={`py-3 rounded-xl text-sm font-semibold ${duration === m ? 'bg-green-700 text-white' : 'bg-stone-50 text-stone-700'}`}>{m} bln</button>)}</div>
        </div>
        <div className="mb-5">
          <label className="font-semibold text-sm mb-2 block">Metode Pembayaran</label>
          <div className="space-y-2">{[
            { id: 'transfer', label: 'Transfer Bank', desc: 'BCA, Mandiri, BNI, BRI' },
            { id: 'ewallet', label: 'E-Wallet', desc: 'GoPay, OVO, DANA' },
            { id: 'va', label: 'Virtual Account', desc: 'Bayar via VA bank' },
          ].map(m => (
            <button key={m.id} onClick={() => setPayment(m.id)} className={`w-full p-4 rounded-xl border-2 flex items-center justify-between ${payment === m.id ? 'border-green-700 bg-green-50' : 'border-stone-100'}`}>
              <div className="flex items-center gap-3">
                <CreditCard size={20} className={payment === m.id ? 'text-green-700' : 'text-stone-400'} />
                <div className="text-left"><p className="font-semibold text-sm">{m.label}</p><p className="text-xs text-stone-500">{m.desc}</p></div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${payment === m.id ? 'border-green-700 bg-green-700' : 'border-stone-300'} flex items-center justify-center`}>{payment === m.id && <Check size={12} className="text-white" />}</div>
            </button>
          ))}</div>
        </div>
        <div className="p-4 bg-stone-50 rounded-2xl space-y-2">
          <div className="flex justify-between text-sm"><span>Biaya sewa ({duration} bulan)</span><span>{formatRupiah(total)}</span></div>
          {discount > 0 && <div className="flex justify-between text-sm text-orange-600"><span>Diskon ({kos.promo_percent}%)</span><span>-{formatRupiah(discount)}</span></div>}
          <div className="border-t border-stone-200 pt-2 flex justify-between"><span className="font-bold">Total</span><span className="font-bold text-green-700 text-lg">{formatRupiah(finalTotal)}</span></div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-stone-100 p-4">
        <button onClick={handleBooking} disabled={!moveInDate || submitting} className="w-full py-4 bg-green-700 hover:bg-green-800 disabled:bg-stone-300 text-white rounded-xl font-bold">{submitting ? 'Memproses...' : 'Konfirmasi Booking'}</button>
      </div>
    </div>
  );
}

function SuccessPage({ kos, navigateTo }: any) {
  return (
    <div className="animate-fade-in min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6 animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-green-700 flex items-center justify-center"><Check size={32} className="text-white" /></div>
      </div>
      <h1 className="font-display text-2xl font-bold mb-2">Booking Berhasil!</h1>
      <p className="text-sm text-stone-600 mb-8">Booking untuk <span className="font-semibold">{kos.name}</span> sedang diproses.</p>
      <div className="w-full space-y-2">
        <button onClick={() => navigateTo('bookings')} className="w-full py-3.5 bg-green-700 text-white rounded-xl font-bold">Lihat Booking Saya</button>
        <button onClick={() => navigateTo('home')} className="w-full py-3.5 bg-stone-100 text-stone-700 rounded-xl font-semibold">Kembali ke Beranda</button>
      </div>
    </div>
  );
}

function WishlistPage({ wishlist, kosData, toggleWishlist, navigateTo }: any) {
  const items = kosData.filter((k: any) => wishlist.includes(k.id));
  return (
    <div className="animate-fade-in pb-4">
      <div className="px-5 pt-12 pb-4"><h1 className="font-display text-2xl font-bold">Tersimpan</h1><p className="text-sm text-stone-500 mt-1">{items.length} kos</p></div>
      <div className="px-5 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={48} className="mx-auto text-stone-300 mb-3" />
            <p className="font-semibold mb-1">Belum ada kos tersimpan</p>
            <button onClick={() => navigateTo('search')} className="mt-4 px-6 py-2.5 bg-green-700 text-white rounded-xl font-semibold text-sm">Cari Kos</button>
          </div>
        ) : items.map((kos: any) => <KosCard key={kos.id} kos={kos} wishlist={wishlist} toggleWishlist={toggleWishlist} navigateTo={navigateTo} />)}
      </div>
    </div>
  );
}

function ChatPage({ navigateTo, kosData }: any) {
  return (
    <div className="animate-fade-in">
      <div className="px-5 pt-12 pb-4 border-b border-stone-100"><h1 className="font-display text-2xl font-bold">Pesan</h1></div>
      <div>
        {kosData.slice(0, 3).map((kos: any) => (
          <button key={kos.id} onClick={() => navigateTo('chatRoom', kos)} className="w-full px-5 py-4 flex items-center gap-3 hover:bg-stone-50 border-b border-stone-50 text-left">
            <img src={kos.image} alt="" className="w-14 h-14 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">Pemilik {kos.name}</p>
              <p className="text-xs text-stone-500 truncate">{kos.name}</p>
              <p className="text-sm text-stone-600 truncate mt-1">Halo, ada yang bisa saya bantu?</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatRoomPage({ kos, navigateTo, user }: any) {
  const [messages, setMessages] = useState<any[]>([
    { from: 'them', text: 'Halo, ada yang bisa saya bantu?', time: '14:20' },
  ]);
  const [input, setInput] = useState('');
  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: 'me', text: input, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }]);
    setInput('');
  };
  return (
    <div className="animate-fade-in min-h-screen flex flex-col">
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigateTo('chat')}><ArrowLeft size={22} /></button>
        <img src={kos.image} alt="" className="w-10 h-10 rounded-full object-cover" />
        <div className="flex-1"><p className="font-semibold text-sm">Pemilik Kos</p><p className="text-[10px] text-green-700">● Online</p></div>
      </div>
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${m.from === 'me' ? 'bg-green-700 text-white rounded-br-sm' : 'bg-stone-100 rounded-bl-sm'}`}>
              <p className="text-sm">{m.text}</p><p className={`text-[10px] mt-1 ${m.from === 'me' ? 'text-green-100' : 'text-stone-500'}`}>{m.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="sticky bottom-0 bg-white border-t border-stone-100 p-3 flex items-center gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ketik pesan..." className="flex-1 px-4 py-2.5 bg-stone-100 rounded-full text-sm focus:outline-none" />
        <button onClick={send} className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center"><Send size={18} /></button>
      </div>
    </div>
  );
}

function ProfilePage({ navigateTo, user, bookings, onLogout }: any) {
  const menuItems = [
    { icon: FileText, label: 'Booking Saya', desc: `${bookings.length} aktif`, action: () => navigateTo('bookings') },
    { icon: Heart, label: 'Tersimpan', action: () => navigateTo('wishlist') },
    { icon: Bell, label: 'Notifikasi' },
    { icon: Settings, label: 'Pengaturan' },
    { icon: HelpCircle, label: 'Bantuan' },
  ];
  return (
    <div className="animate-fade-in pb-4">
      <div className="relative px-5 pt-12 pb-6" style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)' }}>
        <h1 className="font-display text-2xl font-bold text-white mb-6">Profil Saya</h1>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-green-800 font-display font-bold text-3xl">{(user.full_name || user.email)[0].toUpperCase()}</div>
          <div className="text-white">
            <p className="font-display text-xl font-bold">{user.full_name || 'User'}</p>
            <p className="text-sm text-green-100">{user.email}</p>
          </div>
        </div>
      </div>
      <div className="px-5 mt-5">
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          {menuItems.map((item, i) => (
            <button key={i} onClick={item.action} className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-stone-50 border-b border-stone-50 last:border-b-0 text-left">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><item.icon size={18} className="text-green-700" /></div>
              <div className="flex-1"><p className="font-semibold text-sm">{item.label}</p>{item.desc && <p className="text-xs text-stone-500">{item.desc}</p>}</div>
              <ChevronRight size={18} className="text-stone-400" />
            </button>
          ))}
        </div>
        <button onClick={onLogout} className="w-full mt-4 py-3.5 bg-red-50 text-red-600 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"><LogOut size={18} /> Keluar</button>
      </div>
    </div>
  );
}

function MyBookingsPage({ bookings, kosData, navigateTo }: any) {
  return (
    <div className="animate-fade-in pb-4">
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100 px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigateTo('profile')}><ArrowLeft size={22} /></button>
        <h1 className="font-display text-lg font-bold">Booking Saya</h1>
      </div>
      <div className="px-5 py-4 space-y-3">
        {bookings.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-stone-300 mb-3" />
            <p className="font-semibold">Belum ada booking</p>
          </div>
        ) : bookings.map((b: any) => {
          const kos = kosData.find((k: any) => k.id === b.kosId);
          if (!kos) return null;
          return (
            <div key={b.id} className="bg-white border border-stone-100 rounded-2xl overflow-hidden">
              <div className="p-4 flex gap-3">
                <img src={kos.image} alt="" className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{kos.name}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{kos.area}, {kos.city}</p>
                  <StatusBadge status={b.status} />
                </div>
              </div>
              <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                <div><p className="text-[10px] text-stone-500">Total ({b.duration} bln)</p><p className="font-bold text-sm text-green-700">{formatRupiah(b.total)}</p></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: any = {
    pending: { label: 'Menunggu', color: 'bg-amber-50 text-amber-700', icon: Clock },
    confirmed: { label: 'Dikonfirmasi', color: 'bg-blue-50 text-blue-700', icon: CheckCircle },
    paid: { label: 'Lunas', color: 'bg-green-50 text-green-700', icon: CheckCircle },
    rejected: { label: 'Ditolak', color: 'bg-red-50 text-red-700', icon: XCircle },
    active: { label: 'Aktif', color: 'bg-green-50 text-green-700', icon: CheckCircle },
    cancelled: { label: 'Dibatalkan', color: 'bg-stone-100 text-stone-600', icon: XCircle },
  }[status] || { label: status, color: 'bg-stone-100', icon: AlertCircle };
  const Icon = config.icon;
  return <div className={`inline-flex items-center gap-1 px-2 py-1 ${config.color} text-[10px] font-semibold rounded-full mt-2`}><Icon size={10} /> {config.label}</div>;
}

function StatusBadgeKos({ status }: { status: string }) {
  const config: any = {
    active: { label: 'Aktif', color: 'bg-green-100 text-green-700' },
    pending: { label: 'Review', color: 'bg-amber-100 text-amber-700' },
    inactive: { label: 'Nonaktif', color: 'bg-stone-100 text-stone-600' },
    rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700' },
  }[status] || { label: status, color: 'bg-stone-100' };
  return <span className={`px-2 py-0.5 ${config.color} text-[10px] font-bold rounded-full whitespace-nowrap`}>{config.label}</span>;
}

// ============ OWNER COMPONENTS ============
function OwnerDashboard({ user, kosList, bookings, navigateTo }: any) {
  const ownerKos = kosList.filter((k: any) => k.owner_id === user.id);
  const ownerBookings = bookings.filter((b: any) => ownerKos.some((k: any) => k.id === b.kosId));
  const pendingBookings = ownerBookings.filter((b: any) => b.status === 'pending');
  const totalRooms = ownerKos.reduce((sum: number, k: any) => sum + (k.total_rooms || 0), 0);
  const occupiedRooms = ownerKos.reduce((sum: number, k: any) => sum + ((k.total_rooms || 0) - (k.available_rooms || 0)), 0);
  const occupancyRate = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const monthlyRev = ownerKos.reduce((s: number, k: any) => s + (k.price_monthly * ((k.total_rooms || 0) - (k.available_rooms || 0))), 0);

  return (
    <div className="animate-fade-in pb-4">
      <div className="relative px-5 pt-12 pb-20 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-bold">{(user.full_name || 'O')[0]}</div>
              <div><p className="text-xs text-green-100">Selamat datang,</p><p className="font-bold">{user.full_name || 'Owner'}</p></div>
            </div>
            <button className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><Bell size={20} /></button>
          </div>
          <p className="text-xs text-green-100 mb-1">Pendapatan Bulan Ini</p>
          <p className="font-display text-3xl font-bold mb-1">{formatRupiah(monthlyRev)}</p>
          <div className="flex items-center gap-1 text-xs"><ArrowUpRight size={14} className="text-emerald-200" /><span className="text-emerald-200 font-semibold">+12.5%</span></div>
        </div>
      </div>

      <div className="px-5 -mt-12 relative z-10 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 grid grid-cols-3 gap-2">
          <div className="text-center"><div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-1"><Building2 size={18} className="text-blue-600" /></div><p className="font-bold text-lg">{ownerKos.length}</p><p className="text-[10px] text-stone-500">Total Kos</p></div>
          <div className="text-center border-x border-stone-100"><div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-1"><Clock size={18} className="text-amber-600" /></div><p className="font-bold text-lg">{pendingBookings.length}</p><p className="text-[10px] text-stone-500">Pending</p></div>
          <div className="text-center"><div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-1"><UserCheck size={18} className="text-green-700" /></div><p className="font-bold text-lg">{occupancyRate}%</p><p className="text-[10px] text-stone-500">Okupansi</p></div>
        </div>
      </div>

      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigateTo('ownerAddKos', null)} className="p-4 bg-green-700 text-white rounded-2xl flex flex-col items-start gap-2">
            <Plus size={22} /><div className="text-left"><p className="font-bold text-sm">Tambah Kos</p><p className="text-xs text-green-100">Listing baru</p></div>
          </button>
          <button onClick={() => navigateTo('ownerBookings')} className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col items-start gap-2">
            <FileText size={22} className="text-amber-700" /><div className="text-left"><p className="font-bold text-sm text-amber-900">Booking Masuk</p><p className="text-xs text-amber-700">{pendingBookings.length} perlu respon</p></div>
          </button>
        </div>
      </div>

      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3"><h3 className="font-display text-lg font-bold">Booking Terbaru</h3><button onClick={() => navigateTo('ownerBookings')} className="text-sm text-green-700 font-semibold">Semua</button></div>
        <div className="space-y-2">
          {ownerBookings.slice(0, 3).map((b: any) => {
            const kos = kosList.find((k: any) => k.id === b.kosId);
            return (
              <div key={b.id} className="bg-white border border-stone-100 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-sm">{(b.userName || 'U')[0]}</div>
                <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{b.userName}</p><p className="text-xs text-stone-500 truncate">{kos?.name} • {b.duration} bln</p></div>
                <StatusBadge status={b.status} />
              </div>
            );
          })}
          {ownerBookings.length === 0 && <p className="text-center text-sm text-stone-500 py-8">Belum ada booking</p>}
        </div>
      </div>
    </div>
  );
}

function OwnerKosList({ user, kosList, navigateTo }: any) {
  const ownerKos = kosList.filter((k: any) => k.owner_id === user.id);
  return (
    <div className="animate-fade-in pb-4">
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100 px-5 py-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Kos Saya</h1>
        <button onClick={() => navigateTo('ownerAddKos', null)} className="w-10 h-10 rounded-xl bg-green-700 text-white flex items-center justify-center"><Plus size={20} /></button>
      </div>
      <div className="px-5 py-4 space-y-3">
        {ownerKos.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={48} className="mx-auto text-stone-300 mb-3" />
            <p className="font-semibold mb-1">Belum ada kos</p>
            <button onClick={() => navigateTo('ownerAddKos', null)} className="mt-4 px-6 py-2.5 bg-green-700 text-white rounded-xl font-semibold text-sm">Tambah Kos</button>
          </div>
        ) : ownerKos.map((kos: any) => (
          <div key={kos.id} onClick={() => navigateTo('ownerKosDetail', kos)} className="bg-white border border-stone-100 rounded-2xl overflow-hidden cursor-pointer">
            <div className="flex">
              <img src={kos.image} alt="" className="w-28 h-28 object-cover" />
              <div className="flex-1 p-3 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1"><p className="font-semibold text-sm line-clamp-1">{kos.name}</p><StatusBadgeKos status={kos.status} /></div>
                <p className="text-xs text-stone-500 mt-0.5">{kos.area}, {kos.city}</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div><p className="text-[10px] text-stone-500">Harga</p><p className="font-bold text-xs text-green-700">{formatShort(kos.price_monthly)}</p></div>
                  <div><p className="text-[10px] text-stone-500">Tersedia</p><p className="font-bold text-xs">{kos.available_rooms}/{kos.total_rooms}</p></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OwnerAddKos({ user, navigateTo, editingKos, supabase, onSuccess }: any) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: editingKos?.name || '', type: editingKos?.type || 'Putri',
    city: editingKos?.city || 'Jakarta Selatan', area: editingKos?.area || '',
    price: editingKos?.price_monthly || '', totalRooms: editingKos?.total_rooms || '',
    available: editingKos?.available_rooms || '', description: editingKos?.description || '',
    facilities: editingKos?.facilities || [], rules: editingKos?.rules || []
  });
  const [ruleInput, setRuleInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const allFacilities = ['WiFi', 'AC', 'Kamar Mandi Dalam', 'Kasur', 'Lemari', 'Parkir Motor', 'Parkir Mobil', 'Dapur Bersama', 'Meja Kerja'];

  const toggleFacility = (f: string) => setForm(prev => ({ ...prev, facilities: prev.facilities.includes(f) ? prev.facilities.filter((x: string) => x !== f) : [...prev.facilities, f] }));
  const addRule = () => { if (!ruleInput.trim()) return; setForm(prev => ({ ...prev, rules: [...prev.rules, ruleInput.trim()] })); setRuleInput(''); };
  const removeRule = (i: number) => setForm(prev => ({ ...prev, rules: prev.rules.filter((_: any, idx: number) => idx !== i) }));

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = {
      owner_id: user.id, name: form.name, description: form.description, type: form.type,
      city: form.city, area: form.area, price_monthly: Number(form.price),
      total_rooms: Number(form.totalRooms), available_rooms: Number(form.available),
      facilities: form.facilities, rules: form.rules, status: 'pending'
    };
    let error;
    if (editingKos) {
      const res = await supabase.from('kos').update(payload).eq('id', editingKos.id);
      error = res.error;
    } else {
      const res = await supabase.from('kos').insert(payload).select().single();
      error = res.error;
      if (!error && res.data) {
        await supabase.from('kos_images').insert({
          kos_id: res.data.id,
          image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
          display_order: 0
        });
      }
    }
    if (!error) { await onSuccess(); navigateTo('ownerKos'); }
    else alert('Gagal: ' + error.message);
    setSubmitting(false);
  };

  return (
    <div className="animate-fade-in pb-32">
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100 px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigateTo('ownerKos')}><ArrowLeft size={22} /></button>
        <div className="flex-1"><h1 className="font-display text-lg font-bold">{editingKos ? 'Edit Kos' : 'Tambah Kos Baru'}</h1><p className="text-xs text-stone-500">Langkah {step} dari 3</p></div>
      </div>
      <div className="px-5 py-3 flex gap-1.5">{[1, 2, 3].map(s => <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-green-700' : 'bg-stone-200'}`}></div>)}</div>
      <div className="p-5">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold mb-2">Info Dasar</h2>
            <div><label className="text-sm font-semibold mb-1.5 block">Nama Kos</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Contoh: Kos Melati" className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700" /></div>
            <div><label className="text-sm font-semibold mb-1.5 block">Tipe</label><div className="grid grid-cols-3 gap-2">{['Putra', 'Putri', 'Campur'].map(t => <button key={t} onClick={() => setForm({...form, type: t})} className={`py-2.5 rounded-xl text-sm font-semibold ${form.type === t ? 'bg-green-700 text-white' : 'bg-stone-50'}`}>{t}</button>)}</div></div>
            <div><label className="text-sm font-semibold mb-1.5 block">Kota</label><select value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm focus:outline-none">{CITIES.filter(c => c !== 'Semua Kota').map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="text-sm font-semibold mb-1.5 block">Area</label><input value={form.area} onChange={(e) => setForm({...form, area: e.target.value})} placeholder="Contoh: Tebet" className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700" /></div>
            <div><label className="text-sm font-semibold mb-1.5 block">Deskripsi</label><textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={4} className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700"></textarea></div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold mb-2">Harga & Kamar</h2>
            <div><label className="text-sm font-semibold mb-1.5 block">Harga/Bulan (Rp)</label><input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} placeholder="1500000" className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-semibold mb-1.5 block">Total Kamar</label><input type="number" value={form.totalRooms} onChange={(e) => setForm({...form, totalRooms: e.target.value})} className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm focus:outline-none" /></div>
              <div><label className="text-sm font-semibold mb-1.5 block">Tersedia</label><input type="number" value={form.available} onChange={(e) => setForm({...form, available: e.target.value})} className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm focus:outline-none" /></div>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold mb-2">Fasilitas & Peraturan</h2>
            <div><label className="text-sm font-semibold mb-2 block">Fasilitas</label><div className="grid grid-cols-2 gap-2">{allFacilities.map(f => {
              const Icon = FACILITY_ICONS[f] || Home;
              const active = form.facilities.includes(f);
              return <button key={f} onClick={() => toggleFacility(f)} className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${active ? 'bg-green-700 text-white' : 'bg-stone-50'}`}><Icon size={16} />{f}</button>;
            })}</div></div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Peraturan</label>
              <div className="flex gap-2 mb-2"><input value={ruleInput} onChange={(e) => setRuleInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addRule()} placeholder="Contoh: Dilarang merokok" className="flex-1 px-4 py-2.5 bg-stone-50 rounded-xl text-sm focus:outline-none" /><button onClick={addRule} className="px-4 bg-green-700 text-white rounded-xl"><Plus size={18} /></button></div>
              <div className="space-y-2">{form.rules.map((r: string, i: number) => <div key={i} className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl"><Shield size={14} className="text-green-700" /><span className="text-sm flex-1">{r}</span><button onClick={() => removeRule(i)}><X size={16} className="text-stone-400" /></button></div>)}</div>
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-stone-100 p-4 flex gap-3">
        {step > 1 && <button onClick={() => setStep(step - 1)} className="flex-1 py-3.5 border border-stone-200 rounded-xl font-semibold text-sm">Kembali</button>}
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} className="flex-1 py-3.5 bg-green-700 text-white rounded-xl font-bold">Lanjut</button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3.5 bg-green-700 disabled:bg-stone-300 text-white rounded-xl font-bold">{submitting ? 'Menyimpan...' : (editingKos ? 'Simpan' : 'Publikasikan')}</button>
        )}
      </div>
    </div>
  );
}

function OwnerKosDetail({ kos, bookings, navigateTo, supabase, onUpdate }: any) {
  const kosBookings = bookings.filter((b: any) => b.kosId === kos.id);
  const deleteKos = async () => {
    if (confirm('Yakin ingin menghapus kos ini?')) {
      await supabase.from('kos').delete().eq('id', kos.id);
      await onUpdate();
      navigateTo('ownerKos');
    }
  };
  const toggleStatus = async () => {
    await supabase.from('kos').update({ status: kos.status === 'active' ? 'inactive' : 'active' }).eq('id', kos.id);
    await onUpdate();
    navigateTo('ownerKos');
  };

  return (
    <div className="animate-fade-in pb-4">
      <div className="relative h-48">
        <img src={kos.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent)' }}>
          <button onClick={() => navigateTo('ownerKos')} className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center"><ArrowLeft size={20} /></button>
          <button onClick={() => navigateTo('ownerAddKos', kos)} className="px-3 py-2 bg-white/95 rounded-xl text-xs font-bold flex items-center gap-1"><Edit3 size={14} /> Edit</button>
        </div>
      </div>
      <div className="px-5 py-5">
        <div className="flex items-start justify-between mb-2"><h1 className="font-display text-xl font-bold flex-1">{kos.name}</h1><StatusBadgeKos status={kos.status} /></div>
        <div className="flex items-center gap-1 text-sm text-stone-600 mb-4"><MapPin size={14} /><span>{kos.area}, {kos.city}</span></div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-blue-50 rounded-2xl p-4"><Eye size={20} className="text-blue-600 mb-2" /><p className="font-bold text-xl">{kos.views || 0}</p><p className="text-xs text-stone-600">Views</p></div>
          <div className="bg-green-50 rounded-2xl p-4"><DollarSign size={20} className="text-green-700 mb-2" /><p className="font-bold text-xl">{formatShort(kos.price_monthly * ((kos.total_rooms || 0) - (kos.available_rooms || 0)))}</p><p className="text-xs text-stone-600">Pendapatan</p></div>
          <div className="bg-amber-50 rounded-2xl p-4"><Star size={20} className="text-amber-600 mb-2" /><p className="font-bold text-xl">{kos.rating}</p><p className="text-xs text-stone-600">Rating</p></div>
          <div className="bg-purple-50 rounded-2xl p-4"><Bed size={20} className="text-purple-600 mb-2" /><p className="font-bold text-xl">{kos.total_rooms - kos.available_rooms}/{kos.total_rooms}</p><p className="text-xs text-stone-600">Terisi</p></div>
        </div>
        <div className="mt-6">
          <h3 className="font-display text-lg font-bold mb-3">Booking ({kosBookings.length})</h3>
          <div className="space-y-2">
            {kosBookings.length === 0 ? <p className="text-center text-sm text-stone-500 py-6">Belum ada booking</p> : kosBookings.map((b: any) => (
              <div key={b.id} className="bg-white border border-stone-100 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-sm">{(b.userName || 'U')[0]}</div>
                <div className="flex-1 min-w-0"><p className="font-semibold text-sm">{b.userName}</p><p className="text-xs text-stone-500">{b.duration} bln</p></div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <button onClick={toggleStatus} className="w-full py-3 bg-stone-100 text-stone-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">{kos.status === 'active' ? <><Ban size={16} /> Nonaktifkan</> : <><CheckCircle size={16} /> Aktifkan</>}</button>
          <button onClick={deleteKos} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"><Trash2 size={16} /> Hapus Kos</button>
        </div>
      </div>
    </div>
  );
}

function OwnerBookings({ user, kosList, bookings, supabase, onUpdate }: any) {
  const [tab, setTab] = useState('pending');
  const ownerKos = kosList.filter((k: any) => k.owner_id === user.id);
  const ownerBookings = bookings.filter((b: any) => ownerKos.some((k: any) => k.id === b.kosId));
  const filtered = tab === 'all' ? ownerBookings : ownerBookings.filter((b: any) => b.status === tab);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    await onUpdate();
  };

  return (
    <div className="animate-fade-in pb-4">
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100 px-5 py-4">
        <h1 className="font-display text-xl font-bold mb-3">Booking Masuk</h1>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">{[
          { id: 'pending', label: 'Pending' }, { id: 'confirmed', label: 'Dikonfirmasi' }, { id: 'paid', label: 'Lunas' }, { id: 'all', label: 'Semua' }
        ].map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${tab === t.id ? 'bg-green-700 text-white' : 'bg-stone-100'}`}>{t.label}</button>)}</div>
      </div>
      <div className="px-5 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16"><FileText size={48} className="mx-auto text-stone-300 mb-3" /><p className="font-semibold">Tidak ada booking</p></div>
        ) : filtered.map((b: any) => {
          const kos = kosList.find((k: any) => k.id === b.kosId);
          return (
            <div key={b.id} className="bg-white border border-stone-100 rounded-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold">{(b.userName || 'U')[0]}</div>
                  <div className="flex-1 min-w-0"><p className="font-bold text-sm">{b.userName}</p><p className="text-xs text-stone-500">{b.userPhone}</p><StatusBadge status={b.status} /></div>
                </div>
                <div className="pl-3 border-l-2 border-stone-100"><p className="text-xs text-stone-500">Kos</p><p className="font-semibold text-sm">{kos?.name}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                    <div><p className="text-stone-500">Durasi</p><p className="font-semibold">{b.duration} bulan</p></div>
                    <div><p className="text-stone-500">Masuk</p><p className="font-semibold">{b.moveInDate}</p></div>
                    <div><p className="text-stone-500">Total</p><p className="font-semibold text-green-700">{formatShort(b.total)}</p></div>
                  </div>
                </div>
              </div>
              {b.status === 'pending' && (
                <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 grid grid-cols-2 gap-2">
                  <button onClick={() => updateStatus(b.id, 'rejected')} className="py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold">Tolak</button>
                  <button onClick={() => updateStatus(b.id, 'confirmed')} className="py-2 bg-green-700 text-white rounded-lg text-xs font-bold">Konfirmasi</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OwnerProfile({ user, navigateTo, onLogout, kosList }: any) {
  return (
    <div className="animate-fade-in pb-4">
      <div className="relative px-5 pt-12 pb-6" style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)' }}>
        <h1 className="font-display text-2xl font-bold text-white mb-6">Profil Owner</h1>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-green-800 font-display font-bold text-3xl">{(user.full_name || 'O')[0]}</div>
          <div className="text-white"><p className="font-display text-xl font-bold">{user.full_name}</p><p className="text-sm text-green-100">{user.email}</p><div className="mt-1 flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-200" /><span className="text-xs text-emerald-200 font-semibold">Owner Terverifikasi</span></div></div>
        </div>
      </div>
      <div className="px-5 mt-5">
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          {[
            { icon: Building2, label: 'Kos Saya', desc: `${kosList.length} listing`, action: () => navigateTo('ownerKos') },
            { icon: FileBarChart, label: 'Laporan' }, { icon: Wallet, label: 'Rekening' }, { icon: Settings, label: 'Pengaturan' }
          ].map((item: any, i) => (
            <button key={i} onClick={item.action} className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-stone-50 border-b border-stone-50 last:border-b-0 text-left">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><item.icon size={18} className="text-green-700" /></div>
              <div className="flex-1"><p className="font-semibold text-sm">{item.label}</p>{item.desc && <p className="text-xs text-stone-500">{item.desc}</p>}</div>
              <ChevronRight size={18} className="text-stone-400" />
            </button>
          ))}
        </div>
        <button onClick={onLogout} className="w-full mt-4 py-3.5 bg-red-50 text-red-600 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"><LogOut size={18} /> Keluar</button>
      </div>
    </div>
  );
}

// ============ ADMIN COMPONENTS ============
function AdminDashboard({ kosList, bookings, navigateTo }: any) {
  const pendingKos = kosList.filter((k: any) => k.status === 'pending');
  const totalRevenue = bookings.filter((b: any) => b.status === 'paid').reduce((s: number, b: any) => s + b.total, 0);

  return (
    <div className="animate-fade-in pb-4">
      <div className="relative px-5 pt-12 pb-20 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7e22ce 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"><Crown size={22} /></div><div><p className="text-xs text-purple-100">Admin Panel</p><p className="font-bold">Mamikos Control</p></div></div>
            <button className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><Bell size={20} /></button>
          </div>
          <p className="text-xs text-purple-100 mb-1">Total GMV</p>
          <p className="font-display text-3xl font-bold mb-1">{formatRupiah(totalRevenue + 45000000)}</p>
          <div className="flex items-center gap-1 text-xs"><ArrowUpRight size={14} className="text-emerald-200" /><span className="text-emerald-200 font-semibold">+24.1%</span></div>
        </div>
      </div>
      <div className="px-5 -mt-12 relative z-10 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 grid grid-cols-2 gap-3">
          <div className="p-3"><Users size={20} className="text-blue-600 mb-2" /><p className="font-bold text-xl">1,247</p><p className="text-xs text-stone-500">Total Users</p></div>
          <button onClick={() => navigateTo('adminKos')} className="p-3 hover:bg-stone-50 rounded-xl text-left"><Building2 size={20} className="text-green-700 mb-2" /><p className="font-bold text-xl">{kosList.length}</p><p className="text-xs text-stone-500">Total Listing</p></button>
        </div>
      </div>
      {pendingKos.length > 0 && (
        <div className="px-5 mb-6">
          <button onClick={() => navigateTo('adminKos')} className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center"><AlertCircle size={22} className="text-amber-700" /></div>
            <div className="flex-1"><p className="font-bold text-amber-900">{pendingKos.length} Listing menunggu review</p><p className="text-xs text-amber-700">Tap untuk review</p></div>
            <ChevronRight size={20} className="text-amber-700" />
          </button>
        </div>
      )}
      <div className="px-5 mb-6">
        <h3 className="font-display text-lg font-bold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigateTo('adminKos')} className="p-4 bg-white border border-stone-100 rounded-2xl flex flex-col items-start gap-2"><Building2 size={22} className="text-green-700" /><div className="text-left"><p className="font-bold text-sm">Kelola Kos</p><p className="text-xs text-stone-500">Approve/reject</p></div></button>
          <button onClick={() => navigateTo('adminBookings')} className="p-4 bg-white border border-stone-100 rounded-2xl flex flex-col items-start gap-2"><FileText size={22} className="text-amber-600" /><div className="text-left"><p className="font-bold text-sm">Booking</p><p className="text-xs text-stone-500">Monitor</p></div></button>
          <button onClick={() => navigateTo('adminReports')} className="p-4 bg-white border border-stone-100 rounded-2xl flex flex-col items-start gap-2"><BarChart3 size={22} className="text-purple-600" /><div className="text-left"><p className="font-bold text-sm">Laporan</p><p className="text-xs text-stone-500">Analytics</p></div></button>
          <button className="p-4 bg-white border border-stone-100 rounded-2xl flex flex-col items-start gap-2"><Users size={22} className="text-blue-600" /><div className="text-left"><p className="font-bold text-sm">Users</p><p className="text-xs text-stone-500">Manage</p></div></button>
        </div>
      </div>
    </div>
  );
}

function AdminKosList({ kosList, navigateTo }: any) {
  const [filter, setFilter] = useState('pending');
  const filtered = filter === 'all' ? kosList : kosList.filter((k: any) => k.status === filter);
  return (
    <div className="animate-fade-in pb-4">
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100 px-5 py-4">
        <h1 className="font-display text-xl font-bold mb-3">Manajemen Kos</h1>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">{[
          { id: 'pending', label: 'Review' }, { id: 'active', label: 'Aktif' }, { id: 'rejected', label: 'Ditolak' }, { id: 'all', label: 'Semua' }
        ].map(t => <button key={t.id} onClick={() => setFilter(t.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${filter === t.id ? 'bg-purple-600 text-white' : 'bg-stone-100'}`}>{t.label}</button>)}</div>
      </div>
      <div className="px-5 py-4 space-y-3">
        {filtered.map((kos: any) => (
          <div key={kos.id} onClick={() => navigateTo('adminKosDetail', kos)} className="bg-white border border-stone-100 rounded-2xl overflow-hidden cursor-pointer">
            <div className="flex">
              <img src={kos.image} alt="" className="w-28 h-28 object-cover" />
              <div className="flex-1 p-3 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1"><p className="font-semibold text-sm line-clamp-1">{kos.name}</p><StatusBadgeKos status={kos.status} /></div>
                <p className="text-xs text-stone-500 mt-0.5">{kos.area}, {kos.city}</p>
                <div className="flex items-center justify-between mt-2"><p className="font-bold text-xs text-green-700">{formatShort(kos.price_monthly)}/bln</p>{kos.verified && <Check size={12} className="text-blue-500" />}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminKosDetail({ kos, supabase, navigateTo, onUpdate }: any) {
  const approve = async () => { await supabase.from('kos').update({ status: 'active', verified: true }).eq('id', kos.id); await onUpdate(); navigateTo('adminKos'); };
  const reject = async () => { await supabase.from('kos').update({ status: 'rejected' }).eq('id', kos.id); await onUpdate(); navigateTo('adminKos'); };

  return (
    <div className="animate-fade-in pb-32">
      <div className="relative h-48">
        <img src={kos.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-0 left-0 right-0 p-4" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent)' }}>
          <button onClick={() => navigateTo('adminKos')} className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center"><ArrowLeft size={20} /></button>
        </div>
      </div>
      <div className="px-5 py-5">
        <div className="flex items-start justify-between mb-2"><h1 className="font-display text-xl font-bold flex-1">{kos.name}</h1><StatusBadgeKos status={kos.status} /></div>
        <div className="flex items-center gap-1 text-sm text-stone-600 mb-4"><MapPin size={14} /><span>{kos.area}, {kos.city}</span></div>
        <div className="space-y-3 mb-5">
          <div className="flex justify-between p-3 bg-white border border-stone-100 rounded-xl"><span className="text-sm text-stone-600">Tipe</span><span className="font-bold text-sm">{kos.type}</span></div>
          <div className="flex justify-between p-3 bg-white border border-stone-100 rounded-xl"><span className="text-sm text-stone-600">Harga</span><span className="font-bold text-sm text-green-700">{formatRupiah(kos.price_monthly)}/bln</span></div>
          <div className="flex justify-between p-3 bg-white border border-stone-100 rounded-xl"><span className="text-sm text-stone-600">Total Kamar</span><span className="font-bold text-sm">{kos.total_rooms}</span></div>
        </div>
        <div className="mb-5"><h3 className="font-display text-lg font-bold mb-2">Deskripsi</h3><p className="text-sm text-stone-600 leading-relaxed">{kos.description}</p></div>
        <div className="mb-5"><h3 className="font-display text-lg font-bold mb-3">Fasilitas</h3><div className="flex flex-wrap gap-2">{(kos.facilities || []).map((f: string) => <span key={f} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">{f}</span>)}</div></div>
      </div>
      {kos.status === 'pending' && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-stone-100 p-4 grid grid-cols-2 gap-3">
          <button onClick={reject} className="py-3.5 border border-red-200 text-red-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><XCircle size={16} /> Tolak</button>
          <button onClick={approve} className="py-3.5 bg-green-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"><CheckCircle size={16} /> Setujui</button>
        </div>
      )}
    </div>
  );
}

function AdminBookings({ bookings, kosList, navigateTo }: any) {
  return (
    <div className="animate-fade-in pb-4">
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100 px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigateTo('adminDashboard')}><ArrowLeft size={22} /></button>
        <h1 className="font-display text-xl font-bold">Semua Booking</h1>
      </div>
      <div className="px-5 py-4 space-y-3">{bookings.map((b: any) => {
        const kos = kosList.find((k: any) => k.id === b.kosId);
        return (
          <div key={b.id} className="bg-white border border-stone-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2"><p className="font-mono text-xs text-stone-500">#{b.id.slice(0, 8)}</p><StatusBadge status={b.status} /></div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><p className="text-[10px] text-stone-500">Penyewa</p><p className="font-semibold text-sm">{b.userName}</p></div>
              <div><p className="text-[10px] text-stone-500">Total</p><p className="font-semibold text-sm text-green-700">{formatShort(b.total)}</p></div>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl"><p className="text-[10px] text-stone-500">Kos</p><p className="font-semibold text-sm">{kos?.name}</p></div>
          </div>
        );
      })}</div>
    </div>
  );
}

function AdminReports({ kosList, bookings, navigateTo }: any) {
  const monthlyData = [
    { month: 'Jan', revenue: 28000000 }, { month: 'Feb', revenue: 35000000 },
    { month: 'Mar', revenue: 42000000 }, { month: 'Apr', revenue: 38000000 }, { month: 'May', revenue: 51000000 }
  ];
  const maxRev = Math.max(...monthlyData.map(d => d.revenue));
  return (
    <div className="animate-fade-in pb-4">
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100 px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigateTo('adminDashboard')}><ArrowLeft size={22} /></button>
        <h1 className="font-display text-xl font-bold">Laporan</h1>
      </div>
      <div className="px-5 py-4 space-y-5">
        <div className="bg-white border border-stone-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4"><div><p className="text-xs text-stone-500">Pendapatan 5 Bulan</p><p className="font-display font-bold text-2xl">{formatRupiah(monthlyData.reduce((s, d) => s + d.revenue, 0))}</p></div><div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full"><ArrowUpRight size={12} className="text-green-700" /><span className="text-xs font-bold text-green-700">+34%</span></div></div>
          <div className="flex items-end gap-3 h-32 mt-6">{monthlyData.map((d, i) => <div key={i} className="flex-1 flex flex-col items-center gap-1"><div className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg" style={{ height: `${(d.revenue / maxRev) * 100}%` }}></div><span className="text-[10px] text-stone-500 font-semibold">{d.month}</span></div>)}</div>
        </div>
        <div className="bg-white border border-stone-100 rounded-2xl p-5">
          <h3 className="font-display font-bold mb-4">Distribusi Tipe</h3>
          <div className="grid grid-cols-3 gap-3">{[
            { type: 'Putri', count: kosList.filter((k: any) => k.type === 'Putri').length, color: 'bg-pink-100 text-pink-700' },
            { type: 'Putra', count: kosList.filter((k: any) => k.type === 'Putra').length, color: 'bg-blue-100 text-blue-700' },
            { type: 'Campur', count: kosList.filter((k: any) => k.type === 'Campur').length, color: 'bg-purple-100 text-purple-700' }
          ].map(t => <div key={t.type} className={`${t.color} rounded-xl p-3 text-center`}><p className="font-display font-bold text-2xl">{t.count}</p><p className="text-xs font-semibold">{t.type}</p></div>)}</div>
        </div>
      </div>
    </div>
  );
}

function AdminProfile({ user, navigateTo, onLogout }: any) {
  return (
    <div className="animate-fade-in pb-4">
      <div className="relative px-5 pt-12 pb-6" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #7e22ce 100%)' }}>
        <h1 className="font-display text-2xl font-bold text-white mb-6">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-purple-800 font-display font-bold text-3xl">{(user.full_name || 'A')[0]}</div>
          <div className="text-white"><p className="font-display text-xl font-bold">{user.full_name}</p><p className="text-sm text-purple-100">{user.email}</p><div className="mt-1 flex items-center gap-1"><Crown size={12} className="text-amber-300" /><span className="text-xs text-amber-200 font-semibold">Super Admin</span></div></div>
        </div>
      </div>
      <div className="px-5 mt-5">
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">{[
          { icon: Building2, label: 'Kelola Kos', action: () => navigateTo('adminKos') },
          { icon: FileText, label: 'Semua Booking', action: () => navigateTo('adminBookings') },
          { icon: BarChart3, label: 'Laporan', action: () => navigateTo('adminReports') },
          { icon: Settings, label: 'Pengaturan' }
        ].map((item: any, i) => (
          <button key={i} onClick={item.action} className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-stone-50 border-b border-stone-50 last:border-b-0 text-left">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><item.icon size={18} className="text-purple-600" /></div>
            <div className="flex-1"><p className="font-semibold text-sm">{item.label}</p></div>
            <ChevronRight size={18} className="text-stone-400" />
          </button>
        ))}</div>
        <button onClick={onLogout} className="w-full mt-4 py-3.5 bg-red-50 text-red-600 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"><LogOut size={18} /> Keluar</button>
      </div>
    </div>
  );
}

// ============ BOTTOM NAV ============
function BottomNav({ page, navigateTo, wishlistCount, role, pendingCount }: any) {
  let items: any[] = [];
  if (role === 'tenant') {
    items = [
      { id: 'home', icon: Home, label: 'Beranda' },
      { id: 'search', icon: Search, label: 'Cari' },
      { id: 'wishlist', icon: Heart, label: 'Wishlist', badge: wishlistCount },
      { id: 'chat', icon: MessageCircle, label: 'Pesan' },
      { id: 'profile', icon: User, label: 'Profil' },
    ];
  } else if (role === 'owner') {
    items = [
      { id: 'ownerDashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'ownerKos', icon: Building2, label: 'Kos' },
      { id: 'ownerBookings', icon: FileText, label: 'Booking', badge: pendingCount },
      { id: 'ownerProfile', icon: User, label: 'Profil' },
    ];
  } else if (role === 'admin') {
    items = [
      { id: 'adminDashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'adminKos', icon: Building2, label: 'Kos', badge: pendingCount },
      { id: 'adminBookings', icon: FileText, label: 'Booking' },
      { id: 'adminReports', icon: BarChart3, label: 'Laporan' },
      { id: 'adminProfile', icon: User, label: 'Profil' },
    ];
  }
  const activeColor = role === 'admin' ? 'text-purple-600' : 'text-green-700';
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-stone-100 px-2 py-2 flex items-center justify-around z-30">
      {items.map(item => {
        const active = page === item.id;
        return (
          <button key={item.id} onClick={() => navigateTo(item.id)} className="flex flex-col items-center gap-0.5 py-1.5 px-3 relative">
            <div className="relative">
              <item.icon size={22} className={active ? activeColor : 'text-stone-400'} strokeWidth={active ? 2.5 : 2} />
              {item.badge > 0 && <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{item.badge}</span>}
            </div>
            <span className={`text-[10px] ${active ? `${activeColor} font-semibold` : 'text-stone-500'}`}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
