
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, User, Hash, Send, Plus, Link, Trash2, LogOut, Paperclip, ArrowRight, Maximize, Minimize, MessageSquare, Users, Settings, Search, Home } from "lucide-react";
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
export const getUserspaceRooms = () => apiClient.get(`/rooms/userspaces?t=${Date.now()}`);
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

// --- COMPONENTS ---

const showBrowserNotification = (room, message) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const title = `New message in ${room.name}`;
    new Notification(title, { body: `${message.author.name}: ${message.content || 'Attachment'}`, icon: '/favicon.ico', tag: room.id });
};

const LoginModal = ({ onLogin, onClose }) => {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm p-8 bg-white rounded-2xl shadow-xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Welcome Back</h2>
                <p className="text-center text-gray-500 mb-6">Enter your name to join.</p>
                <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !isLoading && (setIsLoading(true), startSession(name).then(r => onLogin(r.data)))} placeholder="Your Name" className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-800 placeholder:text-gray-400" autoFocus />
                <button onClick={() => { setIsLoading(true); startSession(name).then(r => onLogin(r.data)) }} disabled={isLoading} className="w-full mt-6 p-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-70">
                    {isLoading ? "Using Magic..." : "Enter OpenChat"}
                </button>
            </motion.div>
        </motion.div>
    );
};

const CreateRoomModal = ({ onClose, onRoomCreated }) => {
    const [name, setName] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return alert("Enter a name!");
        setIsLoading(true);
        try {
            const { data } = await createRoom({ name, is_public: isPublic });
            onRoomCreated(data);
            onClose();
        } catch (e) { alert("Failed: " + e.message); } finally { setIsLoading(false); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">New Space</h2>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Space Name" className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none mb-6" autoFocus />

                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                    <div>
                        <div className="font-semibold text-gray-700">Public Space</div>
                        <div className="text-xs text-gray-500">Visible to everyone.</div>
                    </div>
                    <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors">Cancel</button>
                    <button onClick={handleCreate} disabled={isLoading} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200">
                        {isLoading ? "Creating..." : "Create Space"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const RoomCard = ({ room, onSelect, isJoined }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg transition-all hover:border-blue-100 group">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Hash size={20} />
                </div>
                <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">{room.name}</h3>
            </div>
            <p className="text-sm text-gray-500 pl-13">{room.active_users || 0} members active</p>
        </div>
        <button onClick={() => onSelect(room)} className={`w-full mt-6 py-2.5 rounded-xl font-semibold transition-all ${isJoined ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100"}`}>
            {isJoined ? "Jump In" : "Join Community"}
        </button>
    </div>
);

const ChatPanel = ({ room, messages, user, onSendMessage, onLeave, isExpanded, onToggleExpand }) => {
    const endRef = useRef(null);
    const [text, setText] = useState("");
    useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                        <Hash size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{room.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Live</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onToggleExpand} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"><Maximize size={18} /></button>
                    <button onClick={() => onLeave(room.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><LogOut size={18} /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                {messages.map((msg, i) => {
                    const isMe = msg.author.id === user.id;
                    return (
                        <motion.div key={msg.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-100'}`}>
                                {msg.author.name[0].toUpperCase()}
                            </div>
                            <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'}`}>
                                {!isMe && <div className="text-xs font-bold text-gray-400 mb-1">{msg.author.name}</div>}
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                {msg.file_url && <a href={msg.file_url} target="_blank" className={`block mt-2 text-sm underline font-medium ${isMe ? 'text-blue-100' : 'text-blue-600'}`}>View Attachment</a>}
                            </div>
                        </motion.div>
                    )
                })}
                <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
                <div className="bg-gray-50 rounded-xl flex items-center px-4 py-2 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
                    <button className="p-2 text-gray-400 hover:text-gray-600"><Paperclip size={20} /></button>
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (onSendMessage({ content: text, type: 'text' }), setText(''))}
                        placeholder={`Message #${room.name}...`}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-700 placeholder:text-gray-400 h-10"
                    />
                    <button onClick={() => { onSendMessage({ content: text, type: 'text' }); setText('') }} className={`p-2 rounded-lg transition-all ${text.trim() ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300'}`}>
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- APP ---
function App() {
    const [user, setUser] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [myRooms, setMyRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [activeTab, setActiveTab] = useState('community');
    const [isLoginOpen, setLoginOpen] = useState(false);
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const ws = useRef(null);

    // FETCH DATA
    const refresh = async () => {
        try {
            const res = activeTab === 'community' ? await getCommunityRooms() : await getUserspaceRooms();
            setRooms(res.data);
            if (user) { const my = await getMyRooms(); setMyRooms(my.data); }
        } catch (e) { }
    };

    useEffect(() => { refresh(); const i = setInterval(refresh, 5000); return () => clearInterval(i); }, [activeTab, user]);
    useEffect(() => { getMySession().then(r => setUser(r.data)).catch(() => { }); }, []);

    // WEBSOCKET
    useEffect(() => {
        if (!selectedRoom || !user) return;
        const connect = async () => {
            try {
                const { data } = await getSessionToken();
                const token = data.token;
                const apiUrl = import.meta.env.VITE_API_URL || "";
                let wsUrl;
                if (apiUrl.startsWith("http")) {
                    const wsProtocol = apiUrl.startsWith("https") ? "wss" : "ws";
                    const hostPath = apiUrl.replace(/^https?:\/\//, "");
                    wsUrl = `${wsProtocol}://${hostPath}/ws/${selectedRoom.id}?token=${token}`;
                } else {
                    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                    wsUrl = `${wsProtocol}//${window.location.host}/api/v1/ws/${selectedRoom.id}?token=${token}`;
                }
                const socket = new WebSocket(wsUrl);
                ws.current = socket;

                socket.onmessage = (e) => {
                    const msg = JSON.parse(e.data);
                    if (msg.room_id === selectedRoom.id) setMessages(p => p.find(m => m.id === msg.id) ? p : [...p, msg]);
                    if (!document.hasFocus() && msg.author.id !== user.id) showBrowserNotification(selectedRoom, msg);
                };

                const hist = await getRoomMessages(selectedRoom.id);
                setMessages(hist.data.reverse());
            } catch (e) { console.error(e); }
        };
        connect();
        return () => ws.current?.close();
    }, [selectedRoom, user]);

    const handleSend = (wsMsg) => ws.current?.send(JSON.stringify(wsMsg));
    const handleLeave = async (rid) => { if (confirm("Are you sure?")) await leaveRoom(rid); setSelectedRoom(null); refresh(); };

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100">
            {/* Navbar */}
            <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 lg:px-12 sticky top-0 bg-white/80 backdrop-blur z-20">
                <div className="flex items-center gap-2 font-black text-xl tracking-tight text-gray-800">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><MessageSquare size={18} /></div>
                    OpenChat
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="text-right hidden sm:block">
                                <div className="font-bold text-sm text-gray-800">{user.name}</div>
                                <div className="text-xs text-gray-500">Online</div>
                            </div>
                            <button onClick={() => setUser(null)} className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center shadow-md">
                                {user.name[0].toUpperCase()}
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setLoginOpen(true)} className="px-5 py-2 rounded-full font-bold text-sm bg-gray-900 text-white hover:bg-gray-800 transition">Log In</button>
                    )}
                </div>
            </div>

            {/* Main Layout */}
            <div className="max-w-7xl mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-4rem)]">

                {/* Sidebar */}
                <div className={`lg:col-span-3 lg:flex flex-col gap-6 ${selectedRoom && isExpanded ? 'hidden' : ''}`}>
                    <div className="space-y-2">
                        <button onClick={() => { setSelectedRoom(null); setActiveTab('community') }} className={`w-full p-3 rounded-xl flex items-center gap-3 font-semibold transition-all ${activeTab === 'community' && !selectedRoom ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                            <Home size={20} /> Discovery
                        </button>
                        <button onClick={() => { setSelectedRoom(null); setActiveTab('userspaces') }} className={`w-full p-3 rounded-xl flex items-center gap-3 font-semibold transition-all ${activeTab === 'userspaces' && !selectedRoom ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                            <Search size={20} /> User Spaces
                        </button>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex-1 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Spaces</h3>
                            <button onClick={() => user ? setCreateOpen(true) : setLoginOpen(true)} className="p-1 text-gray-400 hover:text-blue-600 transition"><Plus size={16} /></button>
                        </div>
                        <div className="space-y-2">
                            {myRooms.map(room => (
                                <button key={room.id} onClick={() => setSelectedRoom(room)} className={`w-full p-3 rounded-xl text-left font-medium flex items-center justify-between group transition-all ${selectedRoom?.id === room.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    <span className="truncate flex items-center gap-2"><Hash size={16} className={selectedRoom?.id === room.id ? "text-gray-400" : "text-gray-300"} /> {room.name}</span>
                                    {room.unread_count > 0 && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                                </button>
                            ))}
                            {myRooms.length === 0 && <div className="text-sm text-gray-400 px-3 italic">No spaces joined yet.</div>}
                        </div>
                    </div>
                </div>

                {/* Main Area */}
                <div className={`lg:col-span-9 h-full transition-all ${selectedRoom && isExpanded ? 'lg:col-span-12 fixed inset-0 z-50 bg-white p-4' : ''}`}>
                    {selectedRoom ? (
                        <ChatPanel room={selectedRoom} messages={messages} user={user} onSendMessage={handleSend} onLeave={handleLeave} isExpanded={isExpanded} onToggleExpand={() => setIsExpanded(!isExpanded)} />
                    ) : (
                        <div className="h-full overflow-y-auto pr-2">
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{activeTab === 'community' ? 'Community Hub' : 'User Spaces'}</h1>
                                <p className="text-gray-500">Explore active communities and join the conversation.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {rooms.map(room => (
                                    <RoomCard key={room.id} room={room} onSelect={async (r) => { if (!user) return setLoginOpen(true); if (!myRooms.find(m => m.id === r.id)) await joinRoom(r.id); setSelectedRoom(r); refresh(); }} isJoined={myRooms.find(m => m.id === room.id)} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isLoginOpen && <LoginModal onClose={() => setLoginOpen(false)} onLogin={(u) => { setUser(u); setLoginOpen(false) }} />}
                {isCreateOpen && <CreateRoomModal onClose={() => setCreateOpen(false)} onRoomCreated={(r) => { setCreateOpen(false); setSelectedRoom(r); refresh(); }} />}
            </AnimatePresence>
        </div>
    );
}

export default App;
