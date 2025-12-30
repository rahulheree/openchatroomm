
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, User, Hash, Send, Plus, Link, Trash2, LogOut, Paperclip, ArrowRight, Maximize, Minimize, MessageSquare, Users, Search, Home, Star, Cloud, Sparkles } from "lucide-react";
import axios from "axios";

// --- API CLIENT ---
const apiClient = axios.create({
    baseURL: "/api/v1",
    withCredentials: true,
});

export const startSession = (name) => apiClient.post("/session/start", { name });
export const getMySession = () => apiClient.get("/session/me");
export const getSessionToken = () => apiClient.get("/session/token");
export const createRoom = (roomData) => apiClient.post("/rooms", roomData);
export const getCommunityRooms = () => apiClient.get("/rooms/community");
export const getUserspaceRooms = () => apiClient.get(`/rooms/userspaces?t=${Date.now()}`); // Cache Buster
export const getMyRooms = () => apiClient.get("/rooms/my");
export const getRoom = (roomId) => apiClient.get(`/rooms/${roomId}`);
export const deleteRoom = (roomId) => apiClient.delete(`/rooms/${roomId}`);
export const joinRoom = (roomId) => apiClient.post(`/rooms/${roomId}/join`);
export const leaveRoom = (roomId) => apiClient.post(`/rooms/${roomId}/leave`);
export const getRoomMembers = (roomId) => apiClient.get(`/rooms/${roomId}/members`);
export const getRoomMessages = (roomId) => apiClient.get(`/rooms/${roomId}/messages`);
export const createInvite = (roomId) => apiClient.post(`/rooms/${roomId}/invite`);
export const getRoomByInvite = (token) => apiClient.get(`/invite/${token}`);
export const uploadFile = (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/upload-file", formData, { headers: { "Content-Type": "multipart/form-data" } });
};

// --- DOODLE ASSETS ---
const DoodleStar = ({ className }) => (
    <motion.svg viewBox="0 0 24 24" fill="currentColor" className={className}
        animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity }}
    >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </motion.svg>
);

const DoodleCloud = ({ className }) => (
    <motion.svg viewBox="0 0 24 24" fill="currentColor" className={className}
        animate={{ x: [0, 10, -10, 0] }} transition={{ duration: 8, repeat: Infinity }}
    >
        <path d="M17.5,19c-0.83,0-1.5-0.67-1.5-1.5c0-0.83,0.67-1.5,1.5-1.5c0.83,0,1.5,0.67,1.5,1.5C19,18.33,18.33,19,17.5,19z M19,8.5 c0-2.21-1.79-4-4-4c-1.85,0-3.41,1.25-3.86,2.96C10.79,7.19,10.42,7,10,7c-1.66,0-3,1.34-3,3c0,0.16,0.02,0.31,0.05,0.46 C5.69,10.97,5,12.39,5,14c0,2.76,2.24,5,5,5h9c2.76,0,5-2.24,5-5C24,11.24,21.76,9,19,8.5z" />
    </motion.svg>
);

// --- COMPONENT: ROOM CARD (BENTO STYLE) ---
const RoomCard = ({ room, onSelect, isJoined, color }) => (
    <motion.div
        whileHover={{ scale: 1.02, rotate: 1 }}
        whileTap={{ scale: 0.95 }}
        className={`bg-[${color}] neo-card p-4 min-h-[140px] flex flex-col justify-between relative overflow-hidden`}
        style={{ backgroundColor: color }}
    >
        <div className="absolute top-[-10px] right-[-10px] opacity-10 rotate-12"><Hash size={80} /></div>
        <div>
            <h3 className="font-bold text-xl truncate pr-2 border-b-2 border-black inline-block mb-1">{room.name}</h3>
            <p className="text-sm font-semibold opacity-70 flex items-center gap-1"><User size={14} /> {room.active_users || 0} online</p>
        </div>
        <button onClick={() => onSelect(room)} className={`w-full mt-3 neo-btn text-sm py-2 ${isJoined ? 'bg-white text-black' : 'bg-black text-white'}`}>
            {isJoined ? "JUMP IN!" : "JOIN SPACE"}
        </button>
    </motion.div>
);

// --- MODALS ---
const LoginModal = ({ onLogin, onClose }) => {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0, rotate: -5 }} animate={{ scale: 1, rotate: 0 }} className="bg-[#fef3c7] neo-card p-8 w-full max-w-sm border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-center mb-4"><div className="w-16 h-16 bg-[#fca5a5] rounded-full border-3 border-black flex items-center justify-center"><User size={32} /></div></div>
                <h2 className="text-3xl font-black text-center mb-2">WHO ARE YOU?</h2>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Pick a cool name..." className="w-full neo-input p-3 mb-4 bg-white text-lg" />
                <button onClick={() => { setIsLoading(true); startSession(name).then(r => onLogin(r.data)).catch(console.error).finally(() => setIsLoading(false)) }} className="w-full neo-btn bg-[#86efac] py-3 text-lg hover:bg-[#4ade80]" disabled={isLoading}>
                    {isLoading ? "LOADING..." : "LET'S GO!"}
                </button>
            </motion.div>
        </div>
    );
};

const CreateRoomModal = ({ onClose, onRoomCreated }) => {
    const [name, setName] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white neo-card p-8 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-2 right-2 neo-btn p-1 bg-red-400">X</button>
                <h2 className="text-2xl font-black mb-4 flex items-center gap-2"><Sparkles className="text-[#fde047]" fill="currentColor" /> CREATE SPACE</h2>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The Chill Zone" className="w-full neo-input p-3 mb-4 bg-slate-50" />
                <div className="flex items-center gap-3 mb-6 p-3 border-3 border-black rounded-xl bg-blue-50">
                    <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-6 h-6 border-3 border-black rounded focus:ring-0 text-black" />
                    <label className="font-bold text-lg">MAKE IT PUBLIC?</label>
                </div>
                <button onClick={() => createRoom({ name, is_public: isPublic }).then(r => { onRoomCreated(r.data); onClose(); })} className="w-full neo-btn bg-[#fca5a5] py-3 text-xl hover:bg-[#f87171]">LAUNCH 🚀</button>
            </motion.div>
        </div>
    );
};

// --- CHAT PANEL ---
const ChatPanel = ({ room, messages, user, onSendMessage, onLeave, onToggleExpand, isExpanded }) => {
    const [text, setText] = useState("");
    const endRef = useRef(null);
    useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

    return (
        <div className={`h-full flex flex-col bg-white ${isExpanded ? '' : 'neo-card'} overflow-hidden relative`}>
            {/* Header */}
            <div className="bg-[#c4b5fd] p-4 border-b-3 border-black flex justify-between items-center">
                <h3 className="font-black text-xl flex items-center gap-2">
                    <span className="w-8 h-8 bg-white border-2 border-black rounded-lg flex items-center justify-center"><Hash size={18} /></span>
                    {room.name}
                </h3>
                <div className="flex gap-2">
                    <button onClick={onToggleExpand} className="neo-btn p-2 bg-white hover:bg-slate-100"><Maximize size={18} /></button>
                    <button onClick={() => onLeave(room.id)} className="neo-btn p-2 bg-red-400 text-white hover:bg-red-500"><LogOut size={18} /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 pattern-dots">
                {messages.map(msg => {
                    const isMe = msg.author.id === user.id;
                    return (
                        <motion.div key={msg.id} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${isMe ? 'bg-[#86efac] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                                {!isMe && <p className="text-xs font-bold mb-1 opacity-50">{msg.author.name}</p>}
                                <p className="font-medium whitespace-pre-wrap">{msg.content}</p>
                                {msg.file_url && (
                                    /\.(jpg|jpeg|png|gif)$/i.test(msg.file_url) ?
                                        <img src={msg.file_url} className="mt-2 rounded-lg border-2 border-black w-full" /> :
                                        <a href={msg.file_url} target="_blank" className="block mt-2 text-blue-600 underline font-bold">Attachment 📎</a>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
                <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t-3 border-black flex gap-2">
                <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && (onSendMessage({ content: text, type: 'text' }), setText(''))} placeholder="Say something..." className="flex-1 neo-input p-2" />
                <button onClick={() => { onSendMessage({ content: text, type: 'text' }); setText(''); }} className="neo-btn bg-[#fde047] p-3 hover:bg-[#facc15]"><Send size={20} /></button>
            </div>
        </div>
    );
};

// --- MAIN APP ---
function App() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('community');
    const [rooms, setRooms] = useState([]); // Unified list
    const [myRooms, setMyRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoginOpen, setLoginOpen] = useState(false);
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [notification, setNotification] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Refs
    const ws = useRef(null);
    const notifiedMessageIds = useRef(new Set());

    // --- INITIAL DATA FETCH ---
    const refreshData = async () => {
        try {
            // Fetch based on active tab
            let res;
            if (activeTab === 'userspaces') res = await getUserspaceRooms();
            else res = await getCommunityRooms();
            setRooms(res.data);

            // Should also refresh myRooms if logged in
            if (user) {
                const myRes = await getMyRooms();
                setMyRooms(myRes.data);
            }
        } catch (e) {
            console.error("Fetch failed", e);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 5000);

        // Check session
        getMySession().then(r => setUser(r.data)).catch(() => { });

        return () => clearInterval(interval);
    }, [activeTab]);

    // --- WEBSOCKET LOGIC (TOKEN AUTH) ---
    useEffect(() => {
        if (!selectedRoom || !user) {
            ws.current?.close();
            return;
        }

        const connectWS = async () => {
            try {
                // TOKEN AUTH FOR WS
                const { data } = await getSessionToken();
                const sessionToken = data.token;

                // URL Construction
                const apiUrl = import.meta.env.VITE_API_URL || "";
                let wsUrl;
                if (apiUrl.startsWith("http")) {
                    const wsProtocol = apiUrl.startsWith("https") ? "wss" : "ws";
                    const hostPath = apiUrl.replace(/^https?:\/\//, "");
                    wsUrl = `${wsProtocol}://${hostPath}/ws/${selectedRoom.id}?token=${sessionToken}`;
                } else {
                    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                    wsUrl = `${wsProtocol}//${window.location.host}/api/v1/ws/${selectedRoom.id}?token=${sessionToken}`;
                }

                console.log("Connecting WS to:", wsUrl);
                const socket = new WebSocket(wsUrl);
                ws.current = socket;

                socket.onmessage = (event) => {
                    const msg = JSON.parse(event.data);
                    if (msg.room_id === selectedRoom.id) {
                        setMessages(prev => {
                            if (prev.find(m => m.id === msg.id)) return prev;
                            return [...prev, msg];
                        });
                    }
                    // Notification Logic
                    if (!document.hasFocus() && msg.author.id !== user.id) {
                        new Notification(`New msg in ${selectedRoom.name}`);
                    }
                };

                // Fetch existing messages
                const hist = await getRoomMessages(selectedRoom.id);
                setMessages(hist.data.reverse());

            } catch (e) { console.error("WS Error", e); }
        };

        connectWS();

        return () => ws.current?.close();
    }, [selectedRoom, user]);

    // --- HANDLERS ---
    const handleJoin = async (room) => {
        if (!user) { setLoginOpen(true); return; }
        try {
            // Check if already joined
            const isMember = myRooms.find(r => r.id === room.id);
            if (!isMember) await joinRoom(room.id);
            const fullRoom = (await getRoom(room.id)).data;
            setSelectedRoom(fullRoom);
            if (!isMember) setMyRooms(prev => [...prev, fullRoom]);
        } catch (e) { console.error(e); }
    };

    const handleSend = (payload) => {
        ws.current?.send(JSON.stringify(payload));
    }

    const handleLeave = async (rid) => {
        if (confirm("Leave this cool room?")) {
            await leaveRoom(rid);
            setMyRooms(prev => prev.filter(r => r.id !== rid));
            setSelectedRoom(null);
        }
    }

    // --- RENDER ---
    const colors = ["#bbf7d0", "#fecaca", "#bfdbfe", "#fde047", "#e9d5ff", "#fed7aa"];

    return (
        <div className="min-h-screen relative overflow-hidden font-fredoka text-slate-900 pb-24">
            {/* Background Doodles */}
            <DoodleCloud className="absolute top-10 left-10 w-32 text-white opacity-60" />
            <DoodleCloud className="absolute top-40 right-20 w-48 text-white opacity-40 delay-1000" />
            <DoodleStar className="absolute bottom-20 left-1/4 w-12 text-[#fde047]" />

            {/* Nav Bar (Visor) */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white neo-card px-6 py-3 flex items-center gap-6 z-40 rounded-full shadow-[0px_10px_20px_rgba(0,0,0,0.2)]">
                <button onClick={() => { setSelectedRoom(null); setActiveTab('community'); }} className={`p-3 rounded-full border-2 border-black transition ${activeTab === 'community' && !selectedRoom ? 'bg-[#fde047] -translate-y-2' : 'bg-slate-100 hover:bg-slate-200'}`}><Home size={24} /></button>
                <button onClick={() => { setSelectedRoom(null); setActiveTab('userspaces'); }} className={`p-3 rounded-full border-2 border-black transition ${activeTab === 'userspaces' && !selectedRoom ? 'bg-[#86efac] -translate-y-2' : 'bg-slate-100 hover:bg-slate-200'}`}><Search size={24} /></button>
                <div className="w-0.5 h-8 bg-black/20"></div>
                <button onClick={() => user ? setCreateOpen(true) : setLoginOpen(true)} className="neo-btn bg-[#fca5a5] text-white p-3 rounded-full hover:scale-110"><Plus size={28} strokeWidth={3} /></button>
                <div className="w-0.5 h-8 bg-black/20"></div>
                {user ?
                    <button onClick={() => setUser(null)} className="w-12 h-12 rounded-full border-2 border-black bg-[#bfdbfe] font-bold text-xl flex items-center justify-center hover:bg-red-200 transition">{user.name[0]}</button>
                    :
                    <button onClick={() => setLoginOpen(true)} className="neo-btn px-4 py-2 bg-black text-white text-sm">LOGIN</button>
                }
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isLoginOpen && <LoginModal onClose={() => setLoginOpen(false)} onLogin={(u) => { setUser(u); setLoginOpen(false) }} />}
                {isCreateOpen && <CreateRoomModal onClose={() => setCreateOpen(false)} onRoomCreated={(r) => { handleJoin(r); refreshData(); }} />}
            </AnimatePresence>

            {/* Main Layout */}
            <div className={`transition-all duration-500 p-4 lg:p-8 grid gap-8 ${selectedRoom ? 'grid-cols-1 lg:grid-cols-[1fr_2fr]' : 'grid-cols-1 lg:grid-cols-[1fr_3fr]'}`}>

                {/* Left: My Spaces (Sidebar) */}
                <div className={`space-y-4 ${selectedRoom && isExpanded ? 'hidden lg:block' : ''}`}>
                    <div className="bg-[#e9d5ff] neo-card p-6 min-h-[300px]">
                        <h2 className="text-2xl font-black mb-4 border-b-3 border-black pb-2">MY SPACES</h2>
                        <div className="space-y-3">
                            {user && myRooms.length > 0 ? myRooms.map(room => (
                                <motion.div key={room.id} whileHover={{ x: 5 }} onClick={() => setSelectedRoom(room)}
                                    className={`cursor-pointer p-3 border-2 border-black rounded-xl font-bold flex justify-between items-center shadow-[3px_3px_0px_0px_#000] transition ${selectedRoom?.id === room.id ? 'bg-[#fde047]' : 'bg-white'}`}>
                                    <span className="truncate"># {room.name}</span>
                                    {room.unread_count > 0 && <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs border-2 border-black">{room.unread_count}</span>}
                                </motion.div>
                            )) : <p className="opacity-50 font-medium italic">Join some spaces to see them here!</p>}
                        </div>
                    </div>
                </div>

                {/* Right: Content Area (Discovery or Chat) */}
                <div className="relative min-h-[80vh]">
                    {selectedRoom ? (
                        <div className={`h-[80vh] ${isExpanded ? 'fixed inset-0 z-50 p-4 bg-black/80 flex items-center justify-center' : 'relative'}`}>
                            <div className={`w-full h-full ${isExpanded ? 'max-w-5xl neo-card' : ''}`}>
                                <ChatPanel room={selectedRoom} messages={messages} user={user} onSendMessage={handleSend} onLeave={handleLeave} onToggleExpand={() => setIsExpanded(!isExpanded)} isExpanded={isExpanded} />
                            </div>
                        </div>
                    ) : (
                        /* Discovery Grid (Bento) */
                        <div className="space-y-6">
                            <div className="flex items-end gap-4 mb-4">
                                <h1 className="text-5xl font-black text-black drop-shadow-sm tracking-tighter">
                                    {activeTab === 'community' ? 'COMMUNITY' : 'USERSPACES'}
                                </h1>
                                <span className="bg-black text-white px-3 py-1 rounded-full font-bold text-sm mb-2 rotate-3">LIVE</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                                {rooms.map((room, i) => (
                                    <RoomCard key={room.id} room={room} onSelect={handleJoin} isJoined={myRooms.find(r => r.id === room.id)} color={colors[i % colors.length]} />
                                ))}
                                {rooms.length === 0 && <div className="col-span-full py-20 text-center opacity-50 font-bold text-xl">No rooms found. Be the first to create one!</div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
