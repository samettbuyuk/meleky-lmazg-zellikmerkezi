import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation 
} from 'react-router-dom';
import { 
  Instagram, 
  Phone, 
  Mail, 
  MapPin, 
  Menu, 
  X, 
  Sparkles,
  Calendar,
  Image as ImageIcon,
  User,
  Heart,
  ChevronRight,
  Navigation,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  serverTimestamp,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fix Leaflet icons
let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Constants
const STORE_COORDS: [number, number] = [41.00282, 39.72692];
const GOOGLE_MAPS_URL = `https://www.google.com/maps/dir/?api=1&destination=${STORE_COORDS[0]},${STORE_COORDS[1]}`;

// Helper: Haversine distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Hizmetlerimiz', path: '/hizmetler' },
    { name: 'Galeri', path: '/galeri' },
    { name: 'Hakkımızda', path: '/hakkimizda' },
    { name: 'İletişim', path: '/iletisim' },
    { name: 'Randevu Al', path: '/randevu', special: true },
  ];

  return (
    <nav className="fixed w-full z-50 transition-all duration-300 bg-primary-50/80 backdrop-blur-md border-b border-stone-900/5">
      <div className="max-w-7xl mx-auto px-12 sm:px-12 lg:px-12">
        <div className="flex justify-between h-24 items-center">
          <Link to="/" className="flex flex-col group">
            <span className="text-2xl font-serif font-bold tracking-[0.2em] text-stone-900 uppercase">Melek Yılmaz</span>
            <span className="text-[9px] uppercase tracking-[0.4em] text-primary-300 font-medium">Güzellik & Estetik • Trabzon</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-12">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                className={cn(
                  "text-[11px] uppercase tracking-widest font-medium transition-colors hover:text-primary-300",
                  location.pathname === link.path ? "text-primary-300 border-b border-primary-300 pb-1" : "text-stone-900",
                  link.special && "text-primary-300 border-b border-primary-300 pb-1 ml-4"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-stone-600">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-cream-200 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-4 text-base font-medium text-stone-700 hover:bg-cream-100 rounded-lg transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-cream-100">
                <Link
                  to="/randevu"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center py-3 bg-primary-500 text-white rounded-full font-semibold shadow-lg shadow-primary-200"
                >
                  Hemen Randevu Al
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#674747] text-primary-50 pt-20 pb-10 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-24 items-start">
          <div className="col-span-1 md:col-span-1 space-y-6">
            <div className="flex flex-col">
              <span className="text-3xl font-serif font-bold text-white tracking-[0.1em] uppercase">Melek Yılmaz</span>
              <div className="mt-2 flex">
                <span className="text-[10px] uppercase tracking-[0.4em] text-[#b19797] bg-[#543b3b] px-3 py-1 rounded-sm font-bold">Güzellik & Estetik</span>
              </div>
            </div>
            <p className="text-stone-300 text-sm leading-relaxed font-light italic max-w-xs">
              Trabzon’da Wella ve Aveda kalitesiyle harmanlanmış, kişiye özel modern bakım ritüelleri.
            </p>
          </div>

          <div className="col-span-1 border-stone-200/10">
            <h4 className="text-[12px] uppercase tracking-[0.3em] font-bold text-white mb-8 border-b border-white/5 pb-4">Kurumsal</h4>
            <ul className="space-y-4">
              <li><Link to="/hizmetler" className="text-stone-300 hover:text-white transition-colors text-xs font-medium tracking-widest uppercase">Hizmetlerimiz</Link></li>
              <li><Link to="/hakkimizda" className="text-stone-300 hover:text-white transition-colors text-xs font-medium tracking-widest uppercase">Hakkımızda</Link></li>
              <li><Link to="/iletisim" className="text-stone-300 hover:text-white transition-colors text-xs font-medium tracking-widest uppercase">İletişim</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-[12px] uppercase tracking-[0.3em] font-bold text-white mb-8 border-b border-white/5 pb-4">Lokasyon</h4>
            <div className="text-stone-300 text-xs leading-loose font-medium space-y-2">
              <p>Meydan, Kahramanmaraş Cd.</p>
              <p>No:45, Ortahisar / Trabzon</p>
              <p className="pt-2 text-white italic font-serif text-sm">+90 462 000 00 00</p>
            </div>
          </div>

          <div className="col-span-1">
             <h4 className="text-[12px] uppercase tracking-[0.3em] font-bold text-white mb-8 border-b border-white/5 pb-4">Randevu Hattı</h4>
             <Link 
               to="/randevu" 
               className="inline-flex items-center space-x-3 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white hover:text-[#674747] transition-all text-xs font-bold tracking-widest uppercase"
             >
               <span>Çevrimiçi Alın</span>
               <ChevronRight size={16} />
             </Link>
          </div>
        </div>
        
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-stone-400 font-medium">© 2026 Melek Yılmaz Güzellik Merkezi.</span>
            <div className="flex items-center gap-4">
              <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400">Her dokunuş bir hikaye.</span>
              <Link to="/admin" className="text-[11px] text-stone-500 hover:text-stone-300 transition-colors opacity-70">• Yönetim Paneli</Link>
            </div>
          </div>
          <div className="flex gap-8 items-center">
               <div className="flex gap-3">
                 <div className="w-12 h-7 bg-white/5 rounded flex items-center justify-center text-[10px] text-stone-400 border border-white/10">VISA</div>
                 <div className="w-12 h-7 bg-white/5 rounded flex items-center justify-center text-[10px] text-stone-400 border border-white/10">MC</div>
               </div>
               <div className="h-8 w-[1px] bg-white/10"></div>
               <div className="flex gap-6">
                  <a href="#" className="text-stone-400 hover:text-white transition-colors"><Instagram size={20} /></a>
                  <a href="#" className="text-stone-400 hover:text-white transition-colors"><Phone size={20} /></a>
               </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Pages ---

const Home = () => {
  return (
    <div className="space-y-0 pb-0 overflow-hidden relative">
      {/* Background Decorative Element */}
      <div className="absolute top-[-100px] right-[-100px] w-[600px] h-[600px] bg-primary-100 rounded-full blur-[140px] opacity-40 z-0 pointer-events-none"></div>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center px-12 py-32 z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-12 w-full pt-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="col-span-12 lg:col-span-7 space-y-10"
          >
            <h1 className="text-[80px] md:text-[120px] leading-[0.85] tracking-tighter text-stone-900">
              Zarafet <br/>
              <span className="italic font-light text-primary-300">Sizinle</span> <br/>
              Başlar
            </h1>
            <p className="max-w-md text-xl leading-relaxed text-stone-600 font-light italic">
              Trabzon’un kalbinde, Wella ve Aveda kalitesiyle harmanlanmış kişisel bakım deneyimi. Kadınlar ve beyler için modern dokunuşlar.
            </p>
            <div className="flex items-center gap-6">
              <div className="h-[1px] w-24 bg-stone-900"></div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-900">Instagram'da Biz</span>
                <span className="text-sm text-primary-300 font-medium">@melekyilmaz_estetik</span>
              </div>
            </div>
            
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.5 }}
               className="pt-4"
            >
              <Link 
                to="/randevu" 
                className="inline-flex items-center space-x-4 px-10 py-5 bg-primary-300 text-white rounded-xl text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-primary-400 transition-all shadow-xl shadow-primary-300/20"
              >
                <span>Hemen Randevu Al</span>
                <ChevronRight size={16} />
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="col-span-12 lg:col-span-5 relative"
          >
            <div className="aspect-[3/4] rounded-[2rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(212,140,140,0.15)] border-4 border-white">
              <img 
                src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=1200" 
                className="w-full h-full object-cover"
                alt="Beauty Salon"
              />
            </div>
            {/* Appointment Widget Floating */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="absolute -bottom-10 -left-10 hidden xl:block bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-stone-900/5 w-72"
            >
              <h3 className="font-serif text-2xl mb-4">Popüler</h3>
              <div className="space-y-4">
                <div className="p-4 border border-stone-900/5 rounded-2xl bg-white/50">
                  <span className="block font-serif text-lg leading-tight">Cilt Bakımı</span>
                  <span className="text-[9px] uppercase tracking-widest text-primary-300 font-bold">Aveda Rituals</span>
                </div>
                <div className="p-4 border border-stone-900/5 rounded-2xl bg-white/50">
                  <span className="block font-serif text-lg leading-tight">Kaş Tasarım</span>
                  <span className="text-[9px] uppercase tracking-widest text-primary-300 font-bold">Kadın & Erkek</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Services (Horizontal Editorial) */}
      <section className="bg-white py-32 px-12 border-y border-stone-900/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary-300">Neler Yapıyoruz?</span>
              <h2 className="text-6xl text-stone-900 leading-tight">Güzellik <br/> Ritüelleriniz</h2>
            </div>
            <p className="text-stone-400 max-w-sm text-sm font-light leading-relaxed">
              Trabzon Meydan'da profesyonel ekibimizle en modern güzellik çözümlerini sunuyoruz. Wella ve Aveda'nın benzersiz ürün koleksiyonlarıyla kendinizi şımartın.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                tag: "Bakım",
                title: "Cilt Ritüeli",
                desc: "Aveda'nın bitkisel özleriyle yenileyici bir yolculuk."
              },
              { 
                tag: "Sanat",
                title: "Kaş & Tasarım",
                desc: "Karakterinizi yansıtan, profesyonel altın oran çalışmaları."
              },
              { 
                tag: "Teknoloji",
                title: "Lazer Sistemleri",
                desc: "Pürüzsüz bir gelecek için en yeni teknoloji epilasyon."
              }
            ].map((item, id) => (
              <div key={id} className="group space-y-6">
                <div className="h-[1px] w-full bg-stone-900/10 group-hover:bg-primary-300 transition-colors"></div>
                <div className="space-y-4">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-primary-300 group-hover:translate-x-2 transition-transform block">{item.tag}</span>
                  <h3 className="text-3xl text-stone-800">{item.title}</h3>
                  <p className="text-stone-500 font-light text-sm italic">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const ServicesPage = () => {
  const categories = [
    {
      title: "Cilt Bakımı & Analizi",
      services: [
        { name: "Medikal Cilt Bakımı", duration: "90 Dakika", info: "Derinlemesine temizlik ve nemlendirme." },
        { name: "HydraFacial", duration: "45 Dakika", info: "Leke giderme ve anında parlaklık." },
        { name: "Akne Tedavisi", duration: "60 Dakika", info: "Problemli ciltler için özel seanslar." }
      ]
    },
    {
      title: "Kaş & Göz Estetiği",
      services: [
        { name: "Microblading", duration: "120 Dakika", info: "Kıl tekniği ile doğal kaş görünümü." },
        { name: "Laminasyon", duration: "45 Dakika", info: "Yukarı taranmış, dolgun kaş etkisi." },
        { name: "İpek Kirpik", duration: "90 Dakika", info: "Hacimli ve etkileyici bakışlar." },
        { name: "Erkek Kaş Tasarımı", duration: "20 Dakika", info: "Doğal görünümü bozmadan toplama." }
      ]
    },
    {
      title: "Vücut Bakımı & Epilasyon",
      services: [
        { name: "Buz Lazer Epilasyon", duration: "Değişken", info: "Ağrısız ve hızlı sonuç odaklı." },
        { name: "Lenf Drenaj", duration: "30 Dakika", info: "Ödem atma ve dolaşım hızlandırma." },
        { name: "G5 Masajı", duration: "40 Dakika", info: "Sıkılaşma ve selülit bakımı." }
      ]
    }
  ];

  return (
    <div className="pt-40 pb-20 max-w-7xl mx-auto px-12">
      <div className="mb-24 space-y-4">
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary-300">Menü</span>
        <h1 className="text-6xl md:text-8xl text-stone-900 leading-none">Hizmetlerimiz</h1>
      </div>

      <div className="grid grid-cols-1 gap-32">
        {categories.map((cat, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-4 self-start sticky top-32 space-y-4">
              <span className="text-[9px] uppercase tracking-widest font-bold text-stone-900 opacity-30">Seçenek {idx + 1}</span>
              <h2 className="text-3xl font-serif text-stone-900">{cat.title}</h2>
              <div className="w-12 h-[1px] bg-primary-300"></div>
            </div>
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {cat.services.map((item, sidx) => (
                <div key={sidx} className="p-8 bg-white border border-stone-800/5 rounded-3xl hover:bg-primary-100/30 transition-all group flex flex-col justify-between h-64">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-serif text-stone-900 leading-tight">{item.name}</h3>
                    <p className="text-stone-400 text-xs font-light leading-relaxed">{item.info}</p>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-stone-900/5">
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase tracking-[0.2em] text-stone-300 font-bold mb-1">Tahmini Süre</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-primary-300">{item.duration}</span>
                    </div>
                    <Link to="/randevu" className="w-12 h-12 rounded-full border border-stone-100 flex items-center justify-center text-stone-300 group-hover:text-primary-300 group-hover:bg-white group-hover:border-primary-100 transition-all">
                      <Calendar size={20} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AppointmentPage = () => {
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    service: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Lütfen geçerli bir e-posta adresi giriniz.');
      setLoading(false);
      return;
    }

    if (formData.phone.length !== 11) {
      setError('Lütfen geçerli bir 11 haneli telefon numarası giriniz (Örn: 05XXXXXXXXX).');
      setLoading(false);
      return;
    }

    try {
      const docId = `${formData.date}_${formData.time}_${formData.phone}`; // Phone added to ID to allow multiple users same time if needed or just unique doc
      const appointmentRef = doc(db, 'appointments', docId);
      
      const batch = writeBatch(db);
      
      batch.set(appointmentRef, {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      // We don't strictly block slots anymore to handle multiple services/staff or manual management
      // but if you want to keep slot blocking, we can use a separate slots collection.
      // Keeping it simple for now as requested.

      await batch.commit();

      // Notify Admin via server-side API
      try {
        await fetch('/api/notify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            date: formData.date,
            time: formData.time,
            service: formData.service
          })
        });
      } catch (notifyErr) {
        console.error("Notification failed:", notifyErr);
      }
      
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError('Randevu oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-40 pb-20 max-w-xl mx-auto px-12 text-center space-y-8">
        <h1 className="text-6xl font-serif text-stone-900 leading-none">Randevu <br/><span className="italic text-primary-300">Alındı</span></h1>
        <p className="text-stone-400 font-light italic leading-relaxed text-lg">
          En kısa sürede WhatsApp üzerinden veya telefonla tarafınıza dönüş sağlayarak randevunuzu konfirme edeceğiz.
        </p>
        <Link to="/" className="inline-flex items-center space-x-4 px-10 py-5 bg-primary-300 text-white rounded-xl text-[11px] uppercase tracking-[0.2em] font-bold">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-40 pb-20 max-w-7xl mx-auto px-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
        <div className="lg:col-span-12 mb-12">
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary-300">Rezervasyon</span>
          <h1 className="text-6xl md:text-8xl text-stone-900 leading-none mt-4">Kendi Vaktinizi <br/><span className="italic font-light text-primary-300">Yaratın</span></h1>
        </div>

        <div className="lg:col-span-4 space-y-12">
           <div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-900 mb-6">İletişim Kanalları</h3>
              <div className="space-y-4">
                 <p className="text-sm font-serif">+90 462 000 00 00</p>
                 <a href="https://wa.me/904620000000" target="_blank" rel="noreferrer" className="text-sm font-serif italic text-primary-300 underline block">WhatsApp üzerinden yazın</a>
              </div>
           </div>
           <div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-900 mb-6">Huzur Dolu Saatler</h3>
              <p className="text-xs text-stone-400 leading-relaxed font-light">
                 Hafta içi: 09:00 — 19:30 <br/>
                 Cumartesi: 09:00 — 18:00
              </p>
           </div>
        </div>

        <div className="lg:col-span-8">
           <form onSubmit={handleSubmit} className="p-12 glass-morphism rounded-[3rem] space-y-10">
              {error && (
                <div className="p-4 bg-red-50 text-red-500 rounded-xl text-sm italic">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3 border-b border-stone-900/10 pb-4">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">İsim & Soyisim</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-transparent text-stone-900 focus:outline-none placeholder:text-stone-200 text-lg font-serif" 
                    placeholder="İsminizi belirtin..." 
                  />
                </div>
                <div className="space-y-3 border-b border-stone-900/10 pb-4">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">E-posta Adresi</label>
                  <input 
                    required 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-transparent text-stone-900 focus:outline-none placeholder:text-stone-200 text-lg font-serif" 
                    placeholder="ornek@mail.com" 
                  />
                </div>
                 <div className="space-y-3 border-b border-stone-900/10 pb-4">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">İletişim Hattı</label>
                    <input 
                      required 
                      type="tel" 
                      value={formData.phone}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setFormData({ ...formData, phone: val });
                      }}
                      className="w-full bg-transparent text-stone-900 focus:outline-none placeholder:text-stone-200 text-lg font-serif" 
                      placeholder="05XXXXXXXXX" 
                    />
                 </div>
                 <div className="space-y-3 border-b border-stone-900/10 pb-4">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Tarih Seçimi</label>
                    <input 
                      required 
                      type="date" 
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-transparent text-stone-900 focus:outline-none cursor-pointer text-lg font-serif" 
                    />
                 </div>
                 <div className="space-y-3 border-b border-stone-900/10 pb-4">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Saat Seçimi</label>
                    <select 
                      required 
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      className="w-full bg-transparent text-stone-900 focus:outline-none cursor-pointer text-lg font-serif appearance-none"
                    >
                       <option value="">Saat seçin...</option>
                       {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"].map(t => (
                         <option key={t} value={t}>{t}</option>
                       ))}
                    </select>
                 </div>
              </div>
              <div className="space-y-3 border-b border-stone-900/10 pb-4">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Arzu Edilen Hizmet</label>
                  <select 
                    required 
                    value={formData.service}
                    onChange={e => setFormData({ ...formData, service: e.target.value })}
                    className="w-full bg-transparent text-stone-900 focus:outline-none appearance-none cursor-pointer text-lg font-serif"
                  >
                    <option value="">Hizmet seçin...</option>
                    <option value="Cilt Bakımı & Rituals">Cilt Bakımı & Rituals</option>
                    <option value="Kaş Tasarımı & Form">Kaş Tasarımı & Form</option>
                    <option value="Lazer Epilasyon Sistemleri">Lazer Epilasyon Sistemleri</option>
                    <option value="Kalıcı Makyaj Sanatı">Kalıcı Makyaj Sanatı</option>
                  </select>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-6 bg-stone-900 text-white rounded-2xl text-[12px] uppercase tracking-[0.3em] font-bold hover:bg-primary-300 transition-all flex items-center justify-center space-x-6 group disabled:opacity-50"
              >
                <span>{loading ? 'Gönderiliyor...' : 'Randevu Talebini Onayla'}</span>
                <Sparkles size={20} className="text-primary-300 group-hover:rotate-12 transition-transform" />
              </button>
           </form>
        </div>
      </div>
    </div>
  );
};

const GalleryPage = () => {
  const images = [
    { url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800", title: "Merkezimiz" },
    { url: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&q=80&w=800", title: "Bakım Seansı" },
    { url: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=800", title: "Kaş Tasarımı" },
    { url: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=800", title: "VIP Salon" },
    { url: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=800", title: "Cilt Analizi" },
    { url: "https://images.unsplash.com/photo-1596704017631-989355799967?auto=format&fit=crop&q=80&w=800", title: "Detaylar" },
  ];

  return (
    <div className="pt-40 pb-20 max-w-7xl mx-auto px-12">
      <div className="mb-24 space-y-4">
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary-300">Portfolyo</span>
        <h1 className="text-6xl md:text-8xl text-stone-900 leading-none">Galeri</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {images.map((img, i) => (
          <motion.div 
            key={i}
            whileHover={{ scale: 0.98 }}
            className="group relative aspect-square rounded-2xl overflow-hidden shadow-xl"
          >
            <img src={img.url} alt={img.title} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
            <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white border-b border-white pb-1">{img.title}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-32 p-16 bg-white border border-stone-800/5 rounded-[3rem] text-center max-w-4xl mx-auto">
        <Instagram className="mx-auto text-primary-300 mb-6" size={40} />
        <h3 className="text-3xl font-serif text-stone-900 mb-6">Sosyal Medyada <br/><span className="italic text-primary-300">Melek Yılmaz</span></h3>
        <p className="text-stone-400 text-sm font-light italic mb-8">
          En güncel çalışmalarımız ve güzellik tüyoları için bizi takip edin.
        </p>
        <a href="#" className="inline-flex items-center space-x-3 px-8 py-3 bg-stone-900 text-white rounded-full font-bold hover:bg-stone-800 transition-all text-xs tracking-widest uppercase">
          Takip Et — @melekyilmaz
        </a>
      </div>
    </div>
  );
};

const AboutPage = () => {
  return (
    <div className="pt-40 pb-32">
      <section className="max-w-7xl mx-auto px-12">
        <div className="mb-24 space-y-6">
          <span className="text-[11px] uppercase tracking-[0.5em] font-bold text-primary-300">Sanat & Deneyim</span>
          <h1 className="text-7xl md:text-[140px] text-stone-900 leading-[0.8] tracking-tighter">Bir Güzellik <br/><span className="italic font-light text-primary-300">Mirası</span></h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
          <div className="lg:col-span-12 relative mb-32">
             <div className="aspect-[21/9] rounded-[4rem] overflow-hidden grayscale hover:grayscale-0 transition-all duration-1000 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-stone-900/5">
                <img src="https://images.unsplash.com/photo-1498843053639-170ff2122f35?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover scale-105" alt="Ambience" />
             </div>
             <div className="absolute -bottom-16 left-12 right-12 bg-white/80 backdrop-blur-xl p-12 rounded-[3rem] border border-white shadow-2xl flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1 space-y-2">
                   <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-primary-300">Biz Kimiz?</span>
                   <p className="text-lg font-serif italic text-stone-800 leading-relaxed">"Güzellik bir varış noktası değil, her gün yeniden keşfedilen bir yolculuktur."</p>
                </div>
                <div className="h-12 w-[1px] bg-stone-200 hidden md:block"></div>
                <div className="flex gap-12">
                   <div className="text-center">
                      <p className="text-3xl font-serif text-stone-900">12+</p>
                      <p className="text-[9px] uppercase font-bold text-stone-400 tracking-widest">Uzman Kadro</p>
                   </div>
                   <div className="text-center">
                      <p className="text-3xl font-serif text-stone-900">8000+</p>
                      <p className="text-[9px] uppercase font-bold text-stone-400 tracking-widest">Klinik İşlem</p>
                   </div>
                </div>
             </div>
          </div>
          
          <div className="lg:col-span-7 space-y-16">
            <div className="space-y-8">
              <h2 className="text-5xl text-stone-900 leading-none">Melek Yılmaz'ın <br/><span className="text-primary-300 italic">Tutku Dolu</span> <br/> Başlangıcı</h2>
              <div className="space-y-8 text-stone-600 font-light text-xl leading-relaxed italic pr-12">
                <p>
                  2010 yılında Trabzon'un kalbinde, küçük bir odadan ibaret ama hayalleri sınırsız bir güzellik atölyesi olarak kapılarımızı açtık. Uzman estetisyen Melek Yılmaz'ın "Her misafir bir eserdir" felsefesiyle çıktığı bu yolda, bugün Karadeniz'in en seçkin güzellik duraklarından biri haline geldik.
                </p>
                <p>
                  Başlangıcımız, sadece bir işletme kurmak değil, insanların aynaya baktıklarında kendilerini sevmelerini sağlayacak profesyonel bir sığınak yaratmaktı. Yıllar boyunca dünya genelindeki en modern teknolojileri ve Wella, Aveda gibi global devlerin bakım ritüellerini Trabzon'a taşıdık.
                </p>
                <p>
                  Bugün, uzman estetisyenlerden, deneyimli cilt uzmanlarına ve sanatçı ruhlu kaş tasarımcılarına kadar 12 kişilik dev bir aile olarak hizmet veriyoruz. Bizim için başarı, seans sonunda gözleri parlayan bir misafirimizin "Tam istediğim gibi oldu" demesidir.
                </p>
              </div>
            </div>

            <div className="p-12 bg-primary-100/20 rounded-[3rem] border border-primary-300/10 space-y-8">
               <h3 className="text-2xl text-stone-900 font-serif">Neden Melek Yılmaz?</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <span className="text-[10px] uppercase font-bold text-primary-300 tracking-widest">Kişiselleştirme</span>
                     <p className="text-sm text-stone-500 font-light italic leading-snug">Her cilt tipi benzersizdir. Biz, standart paketler değil, size özel analizlerle oluşturulmuş ritüeller sunuyoruz.</p>
                  </div>
                  <div className="space-y-3">
                     <span className="text-[10px] uppercase font-bold text-primary-300 tracking-widest">Sterilizasyon</span>
                     <p className="text-sm text-stone-500 font-light italic leading-snug">Hijyen, bizim için bir opsiyon değil, temel bir zorunluluktur. Klinik standartlarda dezenfeksiyon sağlıyoruz.</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-5 sticky top-32">
             <div className="relative">
                <div className="aspect-[3/4] rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(212,140,140,0.2)] border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-700">
                   <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover" alt="Melek Yılmaz" />
                </div>
                <div className="absolute -bottom-10 -right-10 bg-stone-900 text-white p-10 rounded-[2.5rem] shadow-2xl -rotate-3 max-w-[280px]">
                   <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-primary-300 block mb-4">Motto</span>
                   <p className="text-lg font-serif italic leading-relaxed">"Zamanı durduramayız ama izlerini silebiliriz."</p>
                   <div className="mt-6 flex justify-end">
                      <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                         <Sparkles size={20} className="text-primary-300" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const StoreMap = () => {
  const [userLocation, setUserLocation] = React.useState<[number, number] | null>(null);
  const [distance, setDistance] = React.useState<string | null>(null);

  React.useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        const dist = getDistance(latitude, longitude, STORE_COORDS[0], STORE_COORDS[1]);
        setDistance(dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`);
      }, (error) => {
        console.error("Geolocation error:", error);
      });
    }
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapContainer 
        center={STORE_COORDS} 
        zoom={16} 
        scrollWheelZoom={false} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={STORE_COORDS}>
          <Popup>
            <div className="font-serif text-center">
              <p className="font-bold">Melek Yılmaz</p>
              <p className="text-[10px] uppercase">Güzellik Merkezi</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      
      <div className="absolute top-6 left-6 z-10 space-y-3">
        <div className="glass-morphism px-5 py-3 rounded-2xl shadow-xl border border-white/40 inline-flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-stone-900">Merkezimiz Açık</span>
        </div>
      </div>

      {distance && (
        <div className="absolute bottom-6 left-6 right-6 z-10">
          <div className="glass-morphism p-6 rounded-[2rem] shadow-2xl border border-white/40 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-300 rounded-full flex items-center justify-center text-white">
                   <Navigation size={20} />
                </div>
                <div>
                   <p className="text-[9px] uppercase tracking-widest font-bold text-stone-400">Yaklaşık Uzaklık</p>
                   <p className="text-xl font-serif text-stone-900">{distance}</p>
                </div>
             </div>
             <a 
               href={GOOGLE_MAPS_URL} 
               target="_blank" 
               rel="noopener noreferrer"
               className="px-8 py-4 bg-stone-900 text-white rounded-xl text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-stone-800 transition-all flex items-center gap-3 w-full sm:w-auto justify-center"
             >
               Yol Tarifi Al
               <ChevronRight size={14} />
             </a>
          </div>
        </div>
      )}
    </div>
  );
};

const ContactPage = () => {
  return (
    <div className="pt-40 pb-20 max-w-7xl mx-auto px-12">
      <div className="mb-24 space-y-4">
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary-300">Merkezimiz</span>
        <h1 className="text-6xl md:text-8xl text-stone-900 leading-none">İletişim</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
        <div className="lg:col-span-5 space-y-12">
           <div className="space-y-8">
              <div className="border-l-2 border-primary-300 pl-8 space-y-2">
                 <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-400">Adres</span>
                 <p className="text-sm font-serif text-stone-900">Meydan, Kahramanmaraş Cd. No:45, Ortahisar / Trabzon</p>
              </div>
              <div className="border-l-2 border-stone-100 pl-8 space-y-2">
                 <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-400">Telefon</span>
                 <p className="text-sm font-serif text-stone-900">+90 462 000 00 00</p>
              </div>
              <div className="border-l-2 border-stone-100 pl-8 space-y-2">
                 <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-400">Dijital</span>
                 <p className="text-sm font-serif text-stone-900">info@melekyilmaz.com</p>
              </div>
           </div>

           <div className="flex gap-6">
              <a href="#" className="w-12 h-12 bg-white border border-stone-800/10 rounded-full flex items-center justify-center hover:bg-stone-900 hover:text-white transition-all"><Instagram size={20} /></a>
              <a href="#" className="w-12 h-12 bg-white border border-stone-800/10 rounded-full flex items-center justify-center hover:bg-stone-900 hover:text-white transition-all"><Phone size={20} /></a>
           </div>
        </div>

        <div className="lg:col-span-7">
           <div className="h-[600px] bg-stone-100 rounded-[3rem] overflow-hidden relative shadow-2xl mb-8 border border-stone-800/10">
              <StoreMap />
           </div>
           <div className="p-12 bg-primary-100/30 rounded-[3rem] space-y-4">
              <h3 className="text-xl font-serif text-stone-900">Randevu mu <span className="italic text-primary-300">İstiyorsunuz?</span></h3>
              <p className="text-sm text-stone-400 font-light italic">Online randevu formumuzu doldurarak saniyeler içinde talebinizi iletebilirsiniz.</p>
              <Link to="/randevu" className="inline-block mt-4 text-[10px] uppercase tracking-widest font-bold text-stone-900 border-b border-stone-900 pb-1">Randevu Formuna Git</Link>
           </div>
        </div>
      </div>
    </div>
  );
};

const AdminPage = () => {
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Custom cancellation states
  const [cancellationTarget, setCancellationTarget] = React.useState<any>(null);
  const [cancelReason, setCancelReason] = React.useState('');

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', u.uid));
          setIsAdmin(adminDoc.exists() || u.email === 'samettbuyuk@gmail.com');
        } catch (err) {
          setIsAdmin(u.email === 'samettbuyuk@gmail.com');
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, 'appointments'), orderBy('date', 'desc'), orderBy('time', 'desc'));
      return onSnapshot(q, (snapshot) => {
        setAppointments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [isAdmin]);

  const updateStatus = async (id: string, status: string, appointmentData?: any) => {
    console.log(`🔄 Durum güncelleme: ${id} -> ${status}`);
    try {
      if (status === 'cancelled' && appointmentData && !cancelReason) {
        setCancellationTarget(appointmentData);
        return;
      }

      const docRef = doc(db, 'appointments', id);
      await updateDoc(docRef, { 
        status,
        cancellationReason: status === 'cancelled' ? cancelReason : null,
        updatedAt: serverTimestamp()
      });
      console.log("✅ Durum başarıyla güncellendi.");

      // If cancelled, notify customer
      if (status === 'cancelled' && appointmentData) {
        try {
          await fetch('/api/notify-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: appointmentData.email,
              name: appointmentData.name,
              service: appointmentData.service,
              date: appointmentData.date,
              time: appointmentData.time,
              reason: cancelReason
            })
          });
          console.log("📨 İptal bildirimi gönderildi.");
        } catch (err) {
          console.error("❌ Müşteri bildirim hatası:", err);
        }
        
        setCancelReason('');
        setCancellationTarget(null);
      }
    } catch (err) {
      console.error("❌ Güncelleme hatası:", err);
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const docRef = doc(db, 'appointments', id);
      await deleteDoc(docRef);
      console.log("✅ Randevu veritabanından silindi:", id);
    } catch (err) {
      console.error("❌ Silme işlemi sırasında hata oluştu:", err);
      handleFirestoreError(err, OperationType.DELETE, `appointments/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="pt-40 pb-32 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-300 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-40 pb-32 max-w-7xl mx-auto px-12 text-center">
        <div className="p-12 glass-morphism rounded-[3rem] max-w-xl mx-auto space-y-8">
          <ShieldCheck className="mx-auto text-primary-300" size={60} />
          <h1 className="text-4xl font-serif">Admin Girişi</h1>
          <p className="text-stone-500 italic">Bu alan sadece Melek Yılmaz yetkilileri içindir.</p>
          <button 
            onClick={signInWithGoogle}
            className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-4"
          >
            Google ile Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="pt-40 pb-32 max-w-7xl mx-auto px-12 text-center">
         <div className="p-12 glass-morphism rounded-[3rem] max-w-xl mx-auto space-y-8">
          <XCircle className="mx-auto text-red-500" size={60} />
          <h1 className="text-4xl font-serif">Yetkisiz Erişim</h1>
          <p className="text-stone-500 italic">Yönetici yetkiniz bulunmuyor. {user.email}</p>
          <button 
            onClick={() => signOut(auth)}
            className="w-full py-4 border border-stone-200 rounded-xl font-bold tracking-widest uppercase text-xs"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-52 pb-32 max-w-7xl mx-auto px-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary-300">Yönetim Paneli</span>
             <div className="h-[1px] w-8 bg-stone-200"></div>
             <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium">
               {currentTime.toLocaleDateString('tr-TR')} • {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
             </span>
          </div>
          <h1 className="text-7xl text-stone-900 leading-none">Randevular</h1>
        </div>
        <button 
          onClick={() => signOut(auth)}
          className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors uppercase text-[10px] font-bold tracking-widest px-6 py-3 border border-stone-100 rounded-xl hover:bg-stone-50"
        >
          <LogOut size={16} />
          Güvenli Çıkış
        </button>
      </div>

      <div className="space-y-6">
        <div className="hidden md:grid grid-cols-12 gap-8 px-10 py-4 text-[10px] uppercase tracking-[0.3em] font-bold text-stone-400 border-b border-stone-100">
          <div className="col-span-3">Müşteri Bilgileri</div>
          <div className="col-span-3">Tercih Edilen Hizmet</div>
          <div className="col-span-3">Randevu Zamanı</div>
          <div className="col-span-2">Mevcut Durum</div>
          <div className="col-span-1 text-right">İşlemler</div>
        </div>
        
        <AnimatePresence mode="popLayout">
          {appointments.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-24 text-center glass-morphism rounded-[3rem] border border-dashed border-stone-200"
            >
              <Calendar className="mx-auto text-stone-200 mb-6" size={48} />
              <p className="text-stone-400 italic">Henüz bir randevu talebi bulunmuyor.</p>
            </motion.div>
          ) : (
            appointments.map((apt) => (
              <motion.div 
                layout
                key={apt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="p-10 glass-morphism rounded-[2.5rem] border border-stone-800/5 hover:border-primary-300/20 transition-all group"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center w-full">
                  <div className="col-span-1 md:col-span-3 space-y-1">
                    <p className="text-lg font-serif text-stone-900">{apt.name}</p>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs text-stone-400 font-medium">{apt.phone}</p>
                      <p className="text-[10px] text-stone-400 italic">{apt.email}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-1 md:col-span-3">
                    <span className="px-3 py-1 bg-stone-50 rounded-lg text-[10px] text-stone-600 font-medium border border-stone-100">
                      {apt.service}
                    </span>
                  </div>
                  
                  <div className="col-span-1 md:col-span-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary-300" />
                      <p className="text-sm font-medium text-stone-700">{apt.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-primary-300" />
                      <p className="text-sm font-medium text-stone-700">{apt.time}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <span className={cn(
                      "px-4 py-2 rounded-full text-[9px] uppercase font-bold tracking-widest inline-block",
                      apt.status === 'confirmed' ? "bg-green-50 text-green-600 border border-green-100" :
                      apt.status === 'cancelled' ? "bg-red-50 text-red-600 border border-red-100" :
                      "bg-amber-50 text-amber-600 border border-amber-100"
                    )}>
                      {apt.status === 'pending' ? 'Talep Bekliyor' : apt.status === 'confirmed' ? 'Onaylandı' : 'İptal Edildi'}
                    </span>
                  </div>

                  <div className="col-span-1 md:col-span-1 flex justify-end gap-3">
                    {apt.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus(apt.id, 'confirmed')}
                        className="p-3 bg-white border border-stone-100 text-stone-300 rounded-xl hover:bg-green-500 hover:text-white hover:border-green-500 transition-all shadow-sm"
                        title="Onayla"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                    {apt.status !== 'cancelled' && (
                      <button 
                        onClick={() => updateStatus(apt.id, 'cancelled', apt)}
                        className="p-3 bg-white border border-stone-100 text-stone-300 rounded-xl hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm"
                        title="İptal Et"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                    
                    {/* ADMIN SILME BUTONU - SADECE IPTAL EDILENLERDE GORUNUR */}
                    {apt.status === 'cancelled' && (
                      <button 
                        onClick={() => deleteAppointment(apt.id)}
                        className="p-3 bg-white border border-stone-100 text-stone-300 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                        title="Randevuyu Kalıcı Olarak Sil"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Cancellation Reason Modal */}
      <AnimatePresence>
        {cancellationTarget && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-12 max-w-lg w-full shadow-2xl border border-stone-100 space-y-8"
            >
              <div className="space-y-4">
                <h3 className="text-3xl font-serif text-stone-900 leading-tight">İptal Nedeni Belirtin</h3>
                <p className="text-stone-400 text-sm font-light italic">
                  <strong>{cancellationTarget.name}</strong> isimli müşteriye gönderilecek iptal sebebini yazınız.
                </p>
              </div>
              
              <textarea 
                className="w-full h-32 p-6 bg-stone-50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-100 transition-all text-stone-700 placeholder:text-stone-300 resize-none"
                placeholder="Örn: Maalesef o saat diliminde uzmanımız müsait değil..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setCancellationTarget(null);
                    setCancelReason('');
                  }}
                  className="flex-1 py-4 text-stone-400 text-xs font-bold uppercase tracking-widest hover:text-stone-900 transition-colors"
                >
                  Vazgeç
                </button>
                <button 
                  onClick={() => updateStatus(cancellationTarget.id, 'cancelled', cancellationTarget)}
                  disabled={!cancelReason.trim()}
                  className="flex-1 py-4 bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  İptal Et ve Mail Gönder
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Page Transition Wrapper ---
const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
};

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-0">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
              <Route path="/hizmetler" element={<PageWrapper><ServicesPage /></PageWrapper>} />
              <Route path="/randevu" element={<PageWrapper><AppointmentPage /></PageWrapper>} />
              <Route path="/galeri" element={<PageWrapper><GalleryPage /></PageWrapper>} />
              <Route path="/hakkimizda" element={<PageWrapper><AboutPage /></PageWrapper>} />
              <Route path="/iletisim" element={<PageWrapper><ContactPage /></PageWrapper>} />
              <Route path="/admin" element={<PageWrapper><AdminPage /></PageWrapper>} />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer />
        <div className="fixed bottom-6 right-6 z-40">
          <a 
            href="#" 
            className="w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95 group"
            title="WhatsApp Destek"
          >
            <Phone size={32} />
            <span className="absolute right-full mr-4 bg-white text-stone-800 px-4 py-2 rounded-xl text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Bize WhatsApp'tan Yazın!
            </span>
          </a>
        </div>
      </div>
    </Router>
  );
}
