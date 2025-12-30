
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Send, Plus, Link, Trash2, LogOut, Paperclip, MessageSquare, Users, Search, Loader, Shield, LogIn } from "lucide-react";
import axios from "axios";

// --- CONFIG ---
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocal ? "http://localhost:8000/api/v1" : "/api/v1";
const WS_URL = isLocal ? "ws://localhost:8000/api/v1/ws" : "wss://openchatroomm.onrender.com/api/v1/ws";

// --- API CLIENT ---
const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

apiClient.interceptors.response.use(
    response => response,
    error => {
        console.error("API Error:", error);
        return Promise.reject(error);
    }
);

// --- API CALLS ---
export const startSession = (name) => apiClient.post("/session/start", { name });
export const getMySession = () => apiClient.get("/session/me");
export const getSessionToken = () => apiClient.get("/session/token");

export const createRoom = (roomData) => apiClient.post("/rooms", roomData);
export const getCommunityRooms = () => apiClient.get("/rooms/community");
export const getUserspaceRooms = () => apiClient.get(`/rooms/userspaces?t=${Date.now()}`);
export const getMyRooms = () => apiClient.get("/rooms/my");
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
    return apiClient.post("/upload-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

const showBrowserNotification = (room, message) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification(`New message in ${room.name}`, {
        body: `${message.author.name}: ${message.content || 'Attachment'}`,
        icon: '/favicon.ico'
    });
};

// --- MODALS ---

const LoginModal = ({ onLogin, onClose }) => {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-sm p-6 bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-center mb-4"><div className="p-3 bg-blue-100 rounded-full"><LogIn className="text-blue-600" size={24} /></div></div>
                <h2 className="text-xl font-bold mb-2 text-center text-slate-800">Welcome Back</h2>
                <p className="text-xs text-center text-slate-500 mb-6">Enter your display name to continue or recover your account.</p>

                <input value={name} onChange={e => setName(e.target.value)} placeholder="Display Name (e.g. Rahul)" className="w-full p-3 border rounded-lg mb-4 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-medium" autoFocus />

                <button onClick={() => { setIsLoading(true); startSession(name).then(r => onLogin(r.data)).catch(e => { alert(e.response?.data?.detail || "Login failed"); setIsLoading(false); }) }} disabled={isLoading || !name.trim()} className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    {isLoading ? "Entering..." : "Continue"}
                </button>
            </motion.div>
        </motion.div>
    );
};

const CreateRoomModal = ({ onClose, onRoomCreated, userRole }) => {
    const [name, setName] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return alert("Name required");
        setIsLoading(true);
        try {
            const { data } = await createRoom({ name, is_public: isPublic });
            onRoomCreated(data);
            onClose();
        } catch (e) { alert("Error: " + (e.response?.data?.detail || e.message)); setIsLoading(false); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-md p-6 bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-slate-800">Create New Space</h2>
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Space Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="#general" className="w-full p-3 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" autoFocus />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border mb-6">
                    <div>
                        <div className="font-semibold text-sm text-slate-700">Public Visibility</div>
                        <div className="text-xs text-slate-500">
                            {userRole === 'admin'
                                ? "Visible to EVERYONE in Community"
                                : isPublic ? "Visible in Userspaces" : "Invite Only (Private)"}
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                    <button onClick={handleCreate} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
                        {isLoading ? "Creating..." : "Create Space"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const JoinByInviteModal = ({ onClose, onJoin }) => {
    const [link, setLink] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleJoin = async () => {
        const token = link.match(/\/invite\/([a-zA-Z0-9-]+)/)?.[1] || link.trim();
        if (!token) return alert("Invalid Link Format");

        setIsLoading(true);
        try {
            const cleanToken = token.replace(/\/$/, "");
            const { data } = await getRoomByInvite(cleanToken);
            await onJoin(data);
            onClose();
        } catch (e) {
            alert(e.response?.data?.detail || "Invalid or Expired Invite");
            setIsLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <motion.div className="w-full max-w-md p-6 bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Join via Link</h2>
                <input value={link} onChange={e => setLink(e.target.value)} placeholder="Paste invite link or token..." className="w-full p-3 border rounded-lg mb-4 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                <button onClick={handleJoin} disabled={isLoading} className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
                    {isLoading ? "Joining..." : "Join Space"}
                </button>
            </motion.div>
        </motion.div>
    );
};

// --- APP ---

function App() {
    const [user, setUser] = useState(null);
    const [communityRooms, setCommunityRooms] = useState([]);
    const [userspaceRooms, setUserspaceRooms] = useState([]);
    const [myRooms, setMyRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [members, setMembers] = useState([]);
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);
    const [isCreateRoomModalOpen, setCreateRoomModalOpen] = useState(false);
    const [isJoinModalOpen, setJoinModalOpen] = useState(false);
    const [notification, setNotification] = useState(null);

    // UI State
    const [activeTab, setActiveTab] = useState('community');
    const [searchQuery, setSearchQuery] = useState("");
    const [isMembersVisible, setMembersVisible] = useState(false);
    const [messageInput, setMessageInput] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);

    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initial Load & Auth Check
    useEffect(() => {
        getMySession().then(r => {
            setUser(r.data);
        }).catch(() => {
            console.log("Not logged in");
            // Don't auto-open login, let them explore or click login
        });

        refreshPublicRooms();
        const i = setInterval(refreshPublicRooms, 5000);
        return () => clearInterval(i);
    }, []);

    // Fetch My Rooms when User logs in
    useEffect(() => {
        if (user) {
            getMyRooms().then(r => setMyRooms(r.data)).catch(console.error);
        } else {
            setMyRooms([]); // Clear private/joined rooms on logout
        }
    }, [user, notification]);

    const refreshPublicRooms = async () => {
        try {
            const [c, u] = await Promise.all([getCommunityRooms(), getUserspaceRooms()]);
            setCommunityRooms(c.data);
            setUserspaceRooms(u.data);
        } catch (e) { console.error("Poll Error", e); }
    };

    // WebSocket Logic (DIRECT CONNECTION)
    useEffect(() => {
        if (!selectedRoom || !user) return;

        if (ws.current) ws.current.close();
        setMessages([]); // Clear prev chats

        const connect = async () => {
            setIsConnecting(true);
            try {
                // 1. Fetch History HTTP
                const [msgs, mems] = await Promise.all([
                    getRoomMessages(selectedRoom.id),
                    getRoomMembers(selectedRoom.id)
                ]);
                setMessages(msgs.data.reverse());
                setMembers(mems.data);

                // 2. Get Token
                const { data } = await getSessionToken();

                // 3. Connect WS (Bypassing Vercel Proxy)
                const wsEndpoint = `${WS_URL}/${selectedRoom.id}?token=${data.token}`;
                console.log("Connecting WS:", wsEndpoint);

                const socket = new WebSocket(wsEndpoint);
                ws.current = socket;

                socket.onopen = () => {
                    console.log("WS Open");
                    setIsConnecting(false);
                };

                socket.onmessage = (e) => {
                    const msg = JSON.parse(e.data);
                    if (msg.room_id === selectedRoom.id) {
                        setMessages(p => {
                            if (p.find(m => m.id === msg.id)) return p;
                            return [...p, msg];
                        });
                    }
                    if (!document.hasFocus() && msg.author?.id !== user.id) showBrowserNotification(selectedRoom, msg);
                };

                socket.onerror = (e) => {
                    console.error("WS Error", e);
                    setNotification("Connection Error");
                    setIsConnecting(false);
                };

                // Auto-reconnect logic could be added here
            } catch (e) {
                console.error(e);
                alert("Connection failed: " + (e.message));
                setIsConnecting(false);
            }
        };
        connect();
        return () => ws.current?.close();
    }, [selectedRoom, user]);

    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

    const handleRoomSelect = async (room) => {
        if (!user) return setLoginModalOpen(true);
        try {
            // Optimistically set selected first for perceived speed
            // If join fails, we'll revert active tab state or show error

            // Check membership locally first
            const isKnownMember = myRooms.some(r => r.id === room.id);
            if (!isKnownMember) {
                await joinRoom(room.id);
                // Refresh my rooms to get updated list
                const { data } = await getMyRooms();
                setMyRooms(data);
            }
            setSelectedRoom(room);
            setMembersVisible(false); // Reset sidebar on room switch
        } catch (e) {
            const errorMsg = e.response?.data?.detail || e.message;
            if (errorMsg.includes("already a member")) {
                setSelectedRoom(room); // Safe to proceed
            } else {
                alert("Could not join: " + errorMsg);
            }
        }
    };

    const handleSend = () => {
        if (!messageInput.trim()) return;
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ content: messageInput, type: 'text' }));
            setMessageInput("");
        } else {
            // Don't reload, just notify
            setNotification("Not connected yet. Please wait...");
            // Try to reconnect if it looks dead
            if (!isConnecting && (!ws.current || ws.current.readyState === WebSocket.CLOSED)) {
                setSelectedRoom({ ...selectedRoom }); // Trigger effect to reconnect
            }
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setNotification("Uploading...");
            const { data } = await uploadFile(file);
            setNotification(null);
            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ content: '', file_url: data.file_url, type: 'file' }));
            }
        } catch (err) {
            console.error(err);
            setNotification(null);
            alert("Upload Failed");
        }
        e.target.value = '';
    };

    const handleInvite = async () => {
        try {
            const { data } = await createInvite(selectedRoom.id);
            const url = `${window.location.origin}/invite/${data.token}`;
            try {
                await navigator.clipboard.writeText(url);
                setNotification("Link Copied!");
                setTimeout(() => setNotification(null), 2000);
            } catch (clipErr) {
                prompt("Copy Link:", url);
            }
        } catch (e) { alert("Only members can create invites."); }
    };

    const handleLogout = () => {
        if (!confirm("Are you sure? This will disconnect your session.")) return;
        document.cookie = "session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUser(null);
        setSelectedRoom(null);
        setMyRooms([]);
        window.location.reload();
    };

    // Filter Logic
    const myRoomIds = new Set(myRooms.map(r => r.id));
    const filteredCommunity = communityRooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredUserspace = userspaceRooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">

            {/* LEFT SIDEBAR */}
            <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0 z-20 hidden md:flex">
                <div className="h-14 flex items-center px-4 font-black text-lg tracking-tight text-slate-800 border-b border-slate-200 bg-white">
                    <div className="w-7 h-7 bg-blue-600 text-white rounded flex items-center justify-center mr-2"><Hash size={18} /></div>
                    OpenChat
                </div>

                <div className="p-3">
                    <div className="bg-slate-200 p-1 rounded-lg flex text-xs font-bold uppercase tracking-wide mb-3">
                        <button onClick={() => setActiveTab('community')} className={`flex-1 py-1.5 rounded-md transition-all ${activeTab === 'community' ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-slate-700'}`}>Community</button>
                        <button onClick={() => setActiveTab('userspaces')} className={`flex-1 py-1.5 rounded-md transition-all ${activeTab === 'userspaces' ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-slate-700'}`}>Userspaces</button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter rooms..." className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {activeTab === 'community' ? 'Official Channels' : 'Community Rooms'}
                    </div>
                    {(activeTab === 'community' ? filteredCommunity : filteredUserspace).map(r => (
                        <button key={r.id} onClick={() => handleRoomSelect(r)} className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between group transition-colors ${selectedRoom?.id === r.id ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-200'}`}>
                            <span className="truncate font-medium flex-1"># {r.name}</span>
                            {myRoomIds.has(r.id) && <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>}
                        </button>
                    ))}
                </div>

                <div className="border-t border-slate-200 bg-white flex-shrink-0 max-h-48 overflow-y-auto p-2">
                    <div className="px-3 py-1 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <span>Joined Spaces</span>
                        <div className="flex gap-2">
                            <Link size={14} className="cursor-pointer hover:text-blue-600" onClick={() => setJoinModalOpen(true)} title="Join by Link" />
                            <Plus size={14} className="cursor-pointer hover:text-blue-600" onClick={() => user ? setCreateRoomModalOpen(true) : setLoginModalOpen(true)} title="Create New" />
                        </div>
                    </div>
                    {myRooms.map(r => (
                        <button key={r.id} onClick={() => handleRoomSelect(r)} className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between group transition-colors ${selectedRoom?.id === r.id ? 'bg-slate-800 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                            <span className="truncate font-medium flex items-center gap-1.5">
                                {r.is_community ? <Shield size={10} className="text-blue-500" /> : <Hash size={12} />}
                                {r.name}
                            </span>
                            {r.unread_count > 0 && <span className="px-1.5 bg-red-500 text-white text-[10px] rounded-full">{r.unread_count}</span>}
                        </button>
                    ))}
                </div>

                <div className="p-3 border-t border-slate-200 bg-slate-50">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">{user.name[0].toUpperCase()}</div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm truncate flex items-center gap-1">
                                    {user.name}
                                    {user.role === 'admin' && <Shield size={12} className="text-blue-500 fill-blue-500" />}
                                </div>
                                <div className="text-xs text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online</div>
                            </div>
                            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500"><LogOut size={16} /></button>
                        </div>
                    ) : (
                        <button onClick={() => setLoginModalOpen(true)} className="w-full py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700">Log In</button>
                    )}
                </div>
            </aside>

            {/* MAIN CHAT */}
            <main className="flex-1 flex flex-col min-w-0 bg-white relative">
                {/* Mobile Header */}
                <header className="md:hidden h-14 border-b border-slate-200 flex items-center justify-between px-4">
                    <div className="font-bold flex items-center gap-2"><div className="w-6 h-6 bg-blue-600 rounded text-white flex items-center justify-center"><Hash size={14} /></div> OC</div>
                    <button onClick={() => setMembersVisible(true)}><Users size={20} /></button>
                </header>

                {selectedRoom ? (
                    <>
                        <header className="h-14 hidden md:flex items-center justify-between px-4 border-b border-slate-200 flex-shrink-0 z-10 bg-white">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    {selectedRoom.is_community ? <Shield size={18} className="text-blue-500" /> : <Hash size={20} className="text-slate-400" />}
                                    {selectedRoom.name}
                                    {!selectedRoom.is_public && <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold border border-slate-200">Private</span>}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {members.length} members &bull; {selectedRoom.is_public ? (selectedRoom.is_community ? 'Community Space' : 'Userspace') : 'Private Space'}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={handleInvite} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors border border-blue-200">
                                    <Link size={14} /> Invite
                                </button>
                                <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
                                <button onClick={() => setMembersVisible(!isMembersVisible)} className={`p-2 rounded-md ${isMembersVisible ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`} title="Members">
                                    <Users size={20} />
                                </button>
                                {user?.id === selectedRoom.owner_id ? (
                                    <button onClick={async () => { if (confirm("Delete Room?")) { await deleteRoom(selectedRoom.id); setSelectedRoom(null); refreshPublicRooms(); } }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Room"><Trash2 size={18} /></button>
                                ) : (
                                    <button onClick={async () => { if (confirm("Leave Room?")) { await leaveRoom(selectedRoom.id); setSelectedRoom(null); refreshPublicRooms(); setMyRooms(p => p.filter(x => x.id !== selectedRoom.id)); } }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors" title="Leave"><LogOut size={18} /></button>
                                )}
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                            {isConnecting && (
                                <div className="flex w-full items-center justify-center p-4 text-slate-500 bg-yellow-50/50 border border-yellow-100 rounded-lg text-sm gap-2">
                                    <Loader className="animate-spin" size={14} /> Establishing connection...
                                </div>
                            )}
                            {messages.map((msg) => {
                                const isMe = msg.author.id === user?.id;
                                const isOwner = msg.author.id === selectedRoom.owner_id;
                                return (
                                    <div key={msg.id} className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-9 h-9 rounded flex items-center justify-center text-sm font-bold flex-shrink-0 ${isMe ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                            {msg.author.name[0].toUpperCase()}
                                        </div>
                                        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-700">{msg.author.name}</span>
                                                {isOwner && <span title="Owner" className="text-[10px] bg-yellow-100 text-yellow-700 px-1 border border-yellow-200 rounded">ADMIN</span>}
                                                <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none'}`}>
                                                {msg.content}
                                                {msg.file_url && (
                                                    <div className="mt-2 pt-2 border-t border-white/20">
                                                        {/\.(jpg|jpeg|png|gif|webp)$/i.test(msg.file_url) ? (
                                                            <img src={msg.file_url} alt="Attachment" className="max-w-full rounded-lg cursor-pointer max-h-60 object-cover" onClick={() => window.open(msg.file_url, '_blank')} />
                                                        ) : (
                                                            <a href={msg.file_url} target="_blank" className="flex items-center gap-2 hover:underline text-xs"><Paperclip size={14} /> View Attachment</a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white border-t border-slate-200">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg p-1.5 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all shadow-sm">
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Paperclip size={20} /></button>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                <input
                                    value={messageInput}
                                    onChange={e => setMessageInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400 text-slate-800"
                                    placeholder={`Message #${selectedRoom.name}...`}
                                    disabled={isConnecting}
                                />
                                <button onClick={handleSend} disabled={isConnecting} className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:grayscale"><Send size={18} /></button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 bg-slate-50/50">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <MessageSquare size={40} className="text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-700 mb-2">Welcome to OpenChat</h3>
                        <p className="max-w-xs text-center text-slate-500">Pick a channel from the left sidebar to start talking.</p>
                        <button onClick={() => user ? setCreateRoomModalOpen(true) : setLoginModalOpen(true)} className="mt-8 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Create New Space</button>
                    </div>
                )}

                {notification && (
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: -20, opacity: 1 }} className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium z-50">
                        {notification}
                    </motion.div>
                )}
            </main>

            <AnimatePresence>
                {selectedRoom && isMembersVisible && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 260, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="bg-slate-50 border-l border-slate-200 flex flex-col flex-shrink-0 overflow-hidden absolute md:relative right-0 h-full z-40 shadow-xl md:shadow-none"
                    >
                        <div className="h-14 flex items-center px-4 font-bold text-slate-700 border-b border-slate-200 bg-white justify-between">
                            <span>Members</span>
                            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{members.length}</span>
                            <button onClick={() => setMembersVisible(false)} className="md:hidden"><Minimize size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {members.map(m => (
                                <div key={m.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-md transition-colors cursor-default">
                                    <div className="w-8 h-8 rounded bg-gradient-to-tr from-slate-300 to-slate-400 text-white flex items-center justify-center text-xs font-bold relative">
                                        {m.name[0].toUpperCase()}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-slate-50 rounded-full"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-700 truncate flex items-center gap-1.5">
                                            {m.name}
                                            {m.id === selectedRoom.owner_id && (
                                                <span title="Owner/Admin" className="text-yellow-500">👑</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-400">Online</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(isLoginModalOpen || isCreateRoomModalOpen || isJoinModalOpen) && (
                    <div className="fixed inset-0 z-[100] pointer-events-none">
                    </div>
                )}
            </AnimatePresence>
            {isLoginModalOpen && <LoginModal onClose={() => setLoginModalOpen(false)} onLogin={u => { setUser(u); setLoginModalOpen(false) }} />}
            {isCreateRoomModalOpen && <CreateRoomModal onClose={() => setCreateRoomModalOpen(false)} onRoomCreated={r => { setMyRooms(p => [...p, r]); setSelectedRoom(r); }} userRole={user?.role} />}
            {isJoinModalOpen && <JoinByInviteModal onClose={() => setJoinModalOpen(false)} onJoin={handleRoomSelect} />}
        </div>
    );
}

export default App;
