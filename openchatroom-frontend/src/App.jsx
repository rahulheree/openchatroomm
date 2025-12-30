
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
    return apiClient.post("/upload-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

const showBrowserNotification = (room, message) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const title = `New message in ${room.name}`;
    new Notification(title, { body: `${message.author.name}: ${message.content || 'Attachment'}`, icon: '/favicon.ico', tag: room.id });
};

// --- MODALS ---

const LoginModal = ({ onLogin, onClose }) => {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-sm p-6 bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-center">Join OpenChat</h2>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Display Name" className="w-full p-3 border rounded-lg mb-4 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" autoFocus />
                <button onClick={() => { setIsLoading(true); startSession(name).then(r => onLogin(r.data)) }} disabled={isLoading} className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
                    {isLoading ? "Joining..." : "Enter"}
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
        if (!name.trim()) return alert("Name required");
        setIsLoading(true);
        try {
            const { data } = await createRoom({ name, is_public: isPublic });
            onRoomCreated(data);
            onClose();
        } catch (e) { alert("Error: " + e.message); setIsLoading(false); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-md p-6 bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6">Create New Space</h2>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="#space-name" className="w-full p-3 border rounded-lg mb-4 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" autoFocus />

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border mb-6">
                    <div>
                        <div className="font-semibold text-sm">Public Space</div>
                        <div className="text-xs text-slate-500">Visible in Userspaces/Community</div>
                    </div>
                    <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-blue-600 w-5 h-5" />
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
    const handleJoin = async () => {
        const token = link.match(/\/invite\/([a-zA-Z0-9-]+)/)?.[1];
        if (!token) return alert("Invalid Link");
        try {
            const { data } = await getRoomByInvite(token);
            await onJoin(data);
            onClose();
        } catch (e) { alert("Invalid or Expired Invite"); }
    };
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
            <motion.div className="w-full max-w-md p-6 bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Join via Link</h2>
                <input value={link} onChange={e => setLink(e.target.value)} placeholder="Paste https://.../invite/..." className="w-full p-3 border rounded-lg mb-4 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                <button onClick={handleJoin} className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Join Space</button>
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
    const [activeTab, setActiveTab] = useState('community'); // 'community' | 'userspaces'
    const [searchQuery, setSearchQuery] = useState("");
    const [isMembersVisible, setMembersVisible] = useState(false);
    const [isProfileOpen, setProfileOpen] = useState(false);
    const [messageInput, setMessageInput] = useState("");

    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initial Load
    useEffect(() => {
        getMySession().then(r => setUser(r.data)).catch(() => { });
        refreshPublicRooms();
        const i = setInterval(refreshPublicRooms, 10000);
        return () => clearInterval(i);
    }, []);

    // Polling & Updates
    useEffect(() => {
        if (user) {
            getMyRooms().then(r => setMyRooms(r.data)).catch(() => { });
        }
    }, [user, notification]);

    const refreshPublicRooms = async () => {
        try {
            const [c, u] = await Promise.all([getCommunityRooms(), getUserspaceRooms()]);
            setCommunityRooms(c.data);
            setUserspaceRooms(u.data);
        } catch (e) { }
    };

    // WebSocket
    useEffect(() => {
        if (!selectedRoom || !user) return;

        const connect = async () => {
            try {
                // Fetch Messages First
                const [msgs, mems] = await Promise.all([getRoomMessages(selectedRoom.id), getRoomMembers(selectedRoom.id)]);
                setMessages(msgs.data.reverse());
                setMembers(mems.data);

                // Connect WS with Token
                const { data } = await getSessionToken();
                const sessionToken = data.token;
                const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
                const host = window.location.host;
                const wsUrl = `${proto}://${host}/api/v1/ws/${selectedRoom.id}?token=${sessionToken}`;

                const socket = new WebSocket(wsUrl);
                ws.current = socket;

                socket.onmessage = (e) => {
                    const msg = JSON.parse(e.data);
                    if (msg.room_id === selectedRoom.id) {
                        setMessages(p => p.find(m => m.id === msg.id) ? p : [...p, msg]);
                    }
                    if (!document.hasFocus() && msg.author.id !== user.id) showBrowserNotification(selectedRoom, msg);
                };
            } catch (e) { console.error(e); }
        };
        connect();
        return () => ws.current?.close();
    }, [selectedRoom, user]);

    // Scroll to bottom
    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

    // Handlers
    const handleRoomSelect = async (room) => {
        if (!user) return setLoginModalOpen(true);
        try {
            if (!myRooms.find(r => r.id === room.id)) {
                await joinRoom(room.id);
                setMyRooms(p => [...p, room]);
            }
            setSelectedRoom(room);
            setMembersVisible(false);
            setMyRooms(p => p.map(r => r.id === room.id ? { ...r, unread_count: 0 } : r));
        } catch (e) { alert("Could not join: " + JSON.stringify(e)); }
    };

    const handleSend = () => {
        if (!messageInput.trim()) return;
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ content: messageInput, type: 'text' }));
            setMessageInput("");
        } else {
            alert("Connecting... please wait.");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            // Creating a temporary message or loading state could be nice here
            const { data } = await uploadFile(file);
            ws.current?.send(JSON.stringify({ content: '', file_url: data.file_url, type: 'file' }));
        } catch (err) { alert("Upload Failed"); }
        e.target.value = ''; // Reset input
    };

    const handleInvite = async () => {
        try {
            const { data } = await createInvite(selectedRoom.id);
            const url = `${window.location.origin}/invite/${data.token}`;
            try {
                await navigator.clipboard.writeText(url);
                setNotification("Invite Copied to Clipboard!");
                setTimeout(() => setNotification(null), 3000);
            } catch (clipErr) {
                prompt("Copy this invite link:", url);
            }
        } catch (e) { alert("Error: You probably need to be the owner to invite."); }
    };

    const handleLogout = () => {
        document.cookie = "session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUser(null);
        setSelectedRoom(null);
        setMyRooms([]);
    };

    const myRoomIds = new Set(myRooms.map(r => r.id));

    return (
        <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">

            {/* LEFT SIDEBAR - ALWAYS VISIBLE */}
            <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0 z-20 hidden md:flex">
                {/* App Header in Sidebar */}
                <div className="h-14 flex items-center px-4 font-black text-lg tracking-tight text-slate-800 border-b border-slate-200 bg-white">
                    <div className="w-7 h-7 bg-blue-600 text-white rounded flex items-center justify-center mr-2"><Hash size={18} /></div>
                    OpenChat
                </div>

                {/* Navigation Tabs */}
                <div className="p-3">
                    <div className="bg-slate-200 p-1 rounded-lg flex text-xs font-bold uppercase tracking-wide mb-3">
                        <button onClick={() => setActiveTab('community')} className={`flex-1 py-1.5 rounded-md transition-all ${activeTab === 'community' ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-slate-700'}`}>Community</button>
                        <button onClick={() => setActiveTab('userspaces')} className={`flex-1 py-1.5 rounded-md transition-all ${activeTab === 'userspaces' ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-slate-700'}`}>Userspaces</button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter rooms..." className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500" />
                    </div>
                </div>

                {/* Public Lists */}
                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {activeTab === 'community' ? 'Official Channels' : 'Community Rooms'}
                    </div>
                    {(activeTab === 'community' ? communityRooms : userspaceRooms)
                        .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(r => (
                            <button key={r.id} onClick={() => handleRoomSelect(r)} className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between group transition-colors ${selectedRoom?.id === r.id ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-200'}`}>
                                <span className="truncate font-medium flex-1"># {r.name}</span>
                                {myRoomIds.has(r.id) && <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>}
                            </button>
                        ))}
                </div>

                {/* My Rooms (Pinned Bottom) */}
                <div className="border-t border-slate-200 bg-white flex-shrink-0 max-h-48 overflow-y-auto p-2">
                    <div className="px-3 py-1 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <span>Joined Spaces</span>
                        <Plus size={14} className="cursor-pointer hover:text-blue-600" onClick={() => user ? setCreateRoomModalOpen(true) : setLoginModalOpen(true)} title="Create New" />
                    </div>
                    {myRooms.map(r => (
                        <button key={r.id} onClick={() => handleRoomSelect(r)} className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between group transition-colors ${selectedRoom?.id === r.id ? 'bg-slate-800 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                            <span className="truncate font-medium flex items-center gap-1.5"><Hash size={12} /> {r.name}</span>
                            {r.unread_count > 0 && <span className="px-1.5 bg-red-500 text-white text-[10px] rounded-full">{r.unread_count}</span>}
                        </button>
                    ))}
                </div>

                {/* User Profile */}
                <div className="p-3 border-t border-slate-200 bg-slate-50">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">{user.name[0].toUpperCase()}</div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm truncate">{user.name}</div>
                                <div className="text-xs text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online</div>
                            </div>
                            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500"><LogOut size={16} /></button>
                        </div>
                    ) : (
                        <button onClick={() => setLoginModalOpen(true)} className="w-full py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700">Log In</button>
                    )}
                </div>
            </aside>

            {/* MAIN CHAT AREA */}
            <main className="flex-1 flex flex-col min-w-0 bg-white relative">
                {/* Mobile Header (Hidden on Desktop) */}
                <header className="md:hidden h-14 border-b border-slate-200 flex items-center justify-between px-4">
                    <div className="font-bold flex items-center gap-2"><div className="w-6 h-6 bg-blue-600 rounded text-white flex items-center justify-center"><Hash size={14} /></div> OC</div>
                    <button onClick={() => setMembersVisible(true)}><Users size={20} /></button>
                </header>

                {selectedRoom ? (
                    <>
                        {/* Chat Header (Desktop) */}
                        <header className="h-14 hidden md:flex items-center justify-between px-4 border-b border-slate-200 flex-shrink-0 z-10 bg-white">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <Hash size={20} className="text-slate-400" />
                                    {selectedRoom.name}
                                    {!selectedRoom.is_public && <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold border border-slate-200">Private</span>}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {selectedRoom.active_users || 1} members active &bull; {selectedRoom.is_public ? 'Public Space' : 'Private Space'}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={handleInvite} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors border border-blue-200">
                                    <Link size={14} /> Invite
                                </button>
                                <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
                                <button onClick={() => setMembersVisible(!isMembersVisible)} className={`p-2 rounded-md ${isMembersVisible ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`} title="Toggle Members">
                                    <Users size={20} />
                                </button>
                                {user?.id === selectedRoom.owner_id ? (
                                    <button onClick={async () => { if (confirm("Delete Room?")) { await deleteRoom(selectedRoom.id); setSelectedRoom(null); refreshPublicRooms(); } }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={18} /></button>
                                ) : (
                                    <button onClick={async () => { if (confirm("Leave Room?")) { await leaveRoom(selectedRoom.id); setSelectedRoom(null); refreshPublicRooms(); setMyRooms(p => p.filter(x => x.id !== selectedRoom.id)); } }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors"><LogOut size={18} /></button>
                                )}
                            </div>
                        </header>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
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
                                            <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                                                {msg.content}
                                                {msg.file_url && (
                                                    <div className="mt-2 pt-2 border-t border-white/20">
                                                        {/\.(jpg|jpeg|png|gif)$/i.test(msg.file_url) ? (
                                                            <img src={msg.file_url} alt="Attachment" className="max-w-full rounded-lg cursor-pointer max-h-60" onClick={() => window.open(msg.file_url, '_blank')} />
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

                        {/* Input Area */}
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
                                />
                                <button onClick={handleSend} className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"><Send size={18} /></button>
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
                        <button onClick={() => setCreateRoomModalOpen(true)} className="mt-8 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Create New Space</button>
                    </div>
                )}

                {/* Notification Toast */}
                {notification && (
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: -20, opacity: 1 }} className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium z-50">
                        {notification}
                    </motion.div>
                )}
            </main>

            {/* 3. RIGHT SIDEBAR - MEMBER LIST */}
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

            {/* Modals via Portal/Absolute */}
            <AnimatePresence>
                {(isLoginModalOpen || isCreateRoomModalOpen || isJoinModalOpen) && (
                    <div className="fixed inset-0 z-[100] pointer-events-none">
                        {/* Modals are rendered here but handle their own overlays/interaction */}
                        {/* Actually they are self-contained above */}
                    </div>
                )}
            </AnimatePresence>
            {isLoginModalOpen && <LoginModal onClose={() => setLoginModalOpen(false)} onLogin={u => { setUser(u); setLoginModalOpen(false) }} />}
            {isCreateRoomModalOpen && <CreateRoomModal onClose={() => setCreateRoomModalOpen(false)} onRoomCreated={r => { setMyRooms(p => [...p, r]); setSelectedRoom(r); }} />}
            {isJoinModalOpen && <JoinByInviteModal onClose={() => setJoinModalOpen(false)} onJoin={handleRoomSelect} />}
        </div>
    );
}

export default App;
