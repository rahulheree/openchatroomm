
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Settings, Mic, Headphones, Plus, Compass, LogOut, Send, Paperclip, X, Users, Search, Bell, User as UserIcon } from "lucide-react";
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

// 1. SERVER ICON (Left Sidebar)
const ServerIcon = ({ name, active, onClick, isAdd, isExplore }) => {
    return (
        <div className="relative group flex items-center justify-center mb-2 w-[72px]">
            {/* Pip */}
            <div className={`absolute left-0 bg-white rounded-r-lg transition-all duration-200 ${active ? 'h-10' : 'h-2 group-hover:h-5'} w-1 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>

            <button
                onClick={onClick}
                className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center overflow-hidden
                ${active ? 'bg-[#5865F2] text-white rounded-[16px]' : 'bg-[#36393f] text-[#dcddde] group-hover:bg-[#5865F2] group-hover:text-white'}
                ${isAdd ? 'text-green-500 bg-[#36393f] group-hover:bg-green-500 group-hover:text-white' : ''}
                ${isExplore ? 'text-green-500 bg-[#36393f] group-hover:bg-green-500 group-hover:text-white' : ''}
                `}
            >
                {isAdd ? <Plus size={24} /> : isExplore ? <Compass size={24} /> : <span className="font-bold">{name?.substring(0, 2).toUpperCase()}</span>}
            </button>
        </div>
    );
};

// 2. DISCORD MESSAGE
const DiscordMessage = ({ msg, isSequence, user }) => {
    const date = new Date(msg.created_at || Date.now());
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isSequence) {
        return (
            <div className="group pl-[72px] pr-4 py-0.5 hover:bg-[#32353b] relative -mt-1">
                <span className="hidden group-hover:block absolute left-4 text-[10px] text-[#72767d] top-2 w-[50px] text-right">{timeStr}</span>
                <p className="text-[#dcddde] whitespace-pre-wrap">{msg.content}</p>
                {msg.file_url && <a href={msg.file_url} target="_blank" className="text-[#00b0f4] text-sm block mt-1">Attachment 📎</a>}
            </div>
        );
    }

    return (
        <div className="group flex pl-4 pr-4 py-1 mt-[17px] hover:bg-[#32353b]">
            <div className="w-10 h-10 rounded-full bg-[#5865F2] flex-shrink-0 flex items-center justify-center text-white font-bold mr-4 mt-0.5 cursor-pointer hover:opacity-80">
                {msg.author.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-white cursor-pointer hover:underline">{msg.author.name}</span>
                    <span className="text-xs text-[#72767d]">{date.toLocaleDateString()} at {timeStr}</span>
                </div>
                <p className="text-[#dcddde] whitespace-pre-wrap">{msg.content}</p>
                {msg.file_url && <a href={msg.file_url} target="_blank" className="text-[#00b0f4] text-sm block mt-1">Attachment 📎</a>}
            </div>
        </div>
    );
};

// 3. CREATE SERVER MODAL
const CreateServerModal = ({ onClose, onCreate }) => {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-[#36393f] rounded-md w-[440px] overflow-hidden text-center">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Customize Your Server</h2>
                    <p className="text-[#b9bbbe] text-sm mb-6">Give your new server a personality with a name. You can always change it later.</p>
                    <div className="mb-4">
                        <label className="text-[#b9bbbe] text-xs font-bold uppercase block text-left mb-2">Server Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#202225] text-[#dcddde] p-2.5 rounded border-none focus:outline-none" />
                    </div>
                </div>
                <div className="bg-[#2f3136] p-4 flex justify-between items-center">
                    <button onClick={onClose} className="text-[#dcddde] text-sm font-medium hover:underline">Back</button>
                    <button onClick={() => { setIsLoading(true); onCreate(name).finally(() => setIsLoading(false)) }} disabled={!name} className="bg-[#5865F2] text-white px-6 py-2.5 rounded-[3px] font-medium text-sm hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? "Creating..." : "Create"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- APP ---
function App() {
    const [user, setUser] = useState(null);
    const [myRooms, setMyRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState("explore"); // 'explore' or room ID
    const [messages, setMessages] = useState([]);
    const [members, setMembers] = useState([]);
    const [exploreRooms, setExploreRooms] = useState([]);

    // UI State
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [showUserList, setShowUserList] = useState(true);

    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    // Initial Load
    useEffect(() => {
        console.log("DISCORD UI VERSION 2.0 CONNECTED 🚀");
        getMySession().then(r => setUser(r.data)).catch(() => { });
        // Poll My Rooms
        const loadMyRooms = () => getMyRooms().then(r => setMyRooms(r.data)).catch(console.error);

        if (user) loadMyRooms();
        const int = setInterval(() => { if (user) loadMyRooms(); }, 5000);
        return () => clearInterval(int);
    }, [user]);

    // Explore Logic
    useEffect(() => {
        if (selectedRoomId === 'explore') {
            const loadExplore = async () => {
                const [c, u] = await Promise.all([getCommunityRooms(), getUserspaceRooms()]);
                setExploreRooms([...c.data, ...u.data]);
            };
            loadExplore();
        }
    }, [selectedRoomId]);

    // Room Logic (Messages + Members + WS)
    useEffect(() => {
        if (selectedRoomId === 'explore' || !user) {
            ws.current?.close();
            return;
        }

        const room = myRooms.find(r => r.id === selectedRoomId);
        if (!room) return;

        // Fetch Data
        Promise.all([getRoomMessages(room.id), getRoomMembers(room.id)]).then(([msgs, mems]) => {
            setMessages(msgs.data.reverse());
            setMembers(mems.data);
        }).catch(console.error);

        // Connect WS
        const connect = async () => {
            try {
                const { data } = await getSessionToken();
                const token = data.token;
                const apiUrl = import.meta.env.VITE_API_URL || "";
                let wsUrl = apiUrl.replace(/^http/, 'ws') + `/ws/${room.id}?token=${token}`;

                // Fallback logic if needed (copied from prev implementation)
                if (!apiUrl) wsUrl = (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + `//${window.location.host}/api/v1/ws/${room.id}?token=${token}`;
                else {
                    const hostPath = apiUrl.replace(/^https?:\/\//, "");
                    const proto = apiUrl.startsWith("https") ? "wss" : "ws";
                    wsUrl = `${proto}://${hostPath}/ws/${room.id}?token=${token}`;
                }

                console.log("Connecting WS to", wsUrl);
                const socket = new WebSocket(wsUrl);
                ws.current = socket;

                socket.onmessage = (e) => {
                    const msg = JSON.parse(e.data);
                    if (msg.room_id === room.id) {
                        setMessages(prev => {
                            if (prev.find(m => m.id === msg.id)) return prev;
                            return [...prev, msg];
                        });
                    }
                };
            } catch (e) { console.error("WS Fail", e); }
        };
        connect();
        return () => ws.current?.close();

    }, [selectedRoomId, user, myRooms]);

    // Scroll to bottom
    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), [messages]);


    // Handlers
    const handleLogin = (name) => startSession(name).then(r => setUser(r.data));
    const handleCreate = async (name) => {
        const { data } = await createRoom({ name, is_public: true });
        setMyRooms(prev => [...prev, data]);
        setSelectedRoomId(data.id);
        setCreateModalOpen(false);
    };
    const handleJoin = async (room) => {
        if (!user) return alert("Please Login First!");
        if (!myRooms.find(r => r.id === room.id)) await joinRoom(room.id);
        setMyRooms(prev => prev.find(r => r.id === room.id) ? prev : [...prev, room]);
        setSelectedRoomId(room.id);
    };
    const handleSend = (text) => {
        if (!text.trim()) return;
        ws.current?.send(JSON.stringify({ content: text, type: "text" }));
    };


    if (!user) {
        // Simple Login Page for Discord
        return (
            <div className="w-full h-screen bg-[#5865F2] flex items-center justify-center overflow-hidden relative">
                <div className="bg-[#36393f] p-8 rounded shadow-2xl w-full max-w-md z-10">
                    <h2 className="text-2xl font-bold text-white text-center mb-2">Welcome Back!</h2>
                    <p className="text-[#b9bbbe] text-center mb-6">We're so excited to see you again!</p>

                    <label className="text-[#b9bbbe] text-xs font-bold uppercase block mb-2">Display Name</label>
                    <input onKeyDown={e => { if (e.key === 'Enter') handleLogin(e.target.value) }} id="logininput" className="w-full bg-[#202225] text-[#dcddde] p-2.5 rounded border border-black/0 focus:border-[#5865F2] outline-none mb-6 transition" />

                    <button onClick={() => handleLogin(document.getElementById('logininput').value)} className="w-full bg-[#5865F2] text-white p-2.5 rounded font-medium hover:bg-[#4752c4] transition">Login</button>
                    <p className="text-[#72767d] text-xs mt-4">Need an account? Too bad, just type a name.</p>
                </div>
            </div>
        )
    }

    const activeRoom = myRooms.find(r => r.id === selectedRoomId);

    return (
        <div className="flex h-screen w-screen bg-[#202225] select-none">
            {/* 1. SERVER LIST (Far Left) */}
            <div className="w-[72px] bg-[#202225] flex flex-col items-center py-3 overflow-y-auto hidden-scrollbar z-20">
                <ServerIcon name="Explore" isExplore active={selectedRoomId === 'explore'} onClick={() => setSelectedRoomId('explore')} />
                <div className="w-8 h-[2px] bg-[#36393f] rounded-lg mb-2"></div>

                {myRooms.map(room => (
                    <ServerIcon key={room.id} name={room.name} active={selectedRoomId === room.id} onClick={() => setSelectedRoomId(room.id)} />
                ))}

                <ServerIcon isAdd onClick={() => setCreateModalOpen(true)} />
            </div>

            {/* 2. CHANNELS SIDEBAR (Left) */}
            <div className="w-60 bg-[#2f3136] flex flex-col min-w-[240px]">
                {/* Header */}
                <div className="h-12 border-b border-[#202225] flex items-center px-4 font-bold text-white shadow-sm cursor-pointer hover:bg-[#34373c] transition">
                    <span className="truncate">{activeRoom ? activeRoom.name : 'Discovery'}</span>
                    {!activeRoom && <Compass size={16} className="ml-auto" />}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2">
                    {activeRoom ? (
                        <>
                            {/* Text Channels */}
                            <div className="flex items-center justify-between px-2 mt-4 mb-1 text-[#8e9297] hover:text-[#dcddde] cursor-pointer">
                                <span className="text-xs font-bold uppercase tracking-wide">Text Channels</span>
                                <Plus size={14} className="cursor-pointer" />
                            </div>
                            <div className="bg-[#393c43] text-white px-2 py-1.5 rounded flex items-center gap-1.5 cursor-pointer mb-0.5">
                                <Hash size={18} className="text-[#72767d]" />
                                <span className="font-medium">general</span>
                            </div>
                            <div className="px-2 py-1.5 rounded flex items-center gap-1.5 cursor-pointer text-[#72767d] hover:bg-[#34373c] hover:text-[#dcddde]">
                                <Hash size={18} />
                                <span className="font-medium">off-topic</span>
                            </div>

                            {/* Voice Channels */}
                            <div className="flex items-center justify-between px-2 mt-4 mb-1 text-[#8e9297] hover:text-[#dcddde] cursor-pointer">
                                <span className="text-xs font-bold uppercase tracking-wide">Voice Channels</span>
                                <Plus size={14} className="cursor-pointer" />
                            </div>
                            <div className="px-2 py-1.5 rounded flex items-center gap-1.5 cursor-pointer text-[#72767d] hover:bg-[#34373c] hover:text-[#dcddde]">
                                <div className="text-[#72767d]"><Mic size={18} /></div>
                                <span className="font-medium">General</span>
                            </div>
                        </>
                    ) : (
                        // Explore Sidebar content
                        <div className="px-2">
                            <div className="text-white font-bold mb-2 mt-2 px-2">Categories</div>
                            <div className="bg-[#393c43] text-white px-2 py-1.5 rounded mb-1 cursor-pointer">Home</div>
                            <div className="text-[#72767d] px-2 py-1.5 hover:bg-[#34373c] hover:text-[#dcddde] rounded cursor-pointer">Music</div>
                            <div className="text-[#72767d] px-2 py-1.5 hover:bg-[#34373c] hover:text-[#dcddde] rounded cursor-pointer">Gaming</div>
                            <div className="text-[#72767d] px-2 py-1.5 hover:bg-[#34373c] hover:text-[#dcddde] rounded cursor-pointer">Education</div>
                        </div>
                    )}
                </div>

                {/* User Bar */}
                <div className="bg-[#292b2f] h-[52px] flex items-center px-2 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold mr-2">
                        {user.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-bold truncate">{user.name}</div>
                        <div className="text-[#b9bbbe] text-xs truncate">#{user.id.toString().substring(0, 4)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-[#36393f] rounded text-[#b9bbbe]"><Mic size={16} /></button>
                        <button className="p-1.5 hover:bg-[#36393f] rounded text-[#b9bbbe]"><Headphones size={16} /></button>
                        <button onClick={() => setUser(null)} className="p-1.5 hover:bg-[#36393f] rounded text-[#b9bbbe]"><Settings size={16} /></button>
                    </div>
                </div>
            </div>

            {/* 3. CENTER + RIGHT */}
            {selectedRoomId === 'explore' ? (
                <div className="flex-1 bg-[#36393f] flex flex-col p-8 overflow-y-auto">
                    <div className="relative mb-8">
                        <div className="h-48 rounded bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                            <h1 className="text-4xl font-extrabold text-white text-center">Find your community on OpenChat</h1>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
                            <input placeholder="Explore communities..." className="w-full p-3 rounded shadow-lg border-none outline-none text-black" />
                        </div>
                    </div>

                    <h2 className="text-white font-bold mb-4">Featured Communities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {exploreRooms.map(room => (
                            <div key={room.id} onClick={() => handleJoin(room)} className="bg-[#2f3136] rounded cursor-pointer hover:bg-[#202225] transition shadow group overflow-hidden">
                                <div className="h-24 bg-[#5865F2]"></div>
                                <div className="p-4 relative">
                                    <div className="w-10 h-10 bg-[#292b2f] rounded-full absolute -top-5 left-4 border-[4px] border-[#2f3136] flex items-center justify-center text-white font-bold text-sm">
                                        {room.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <h3 className="text-white font-bold mt-2 truncate"> {room.name}</h3>
                                    <p className="text-[#b9bbbe] text-xs mt-1">{room.active_users || 0} Online • {room.active_users || 0} Members</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Chat Area */}
                    <div className="flex-1 bg-[#36393f] flex flex-col min-w-0">
                        {/* Header */}
                        <div className="h-12 border-b border-[#202225] flex items-center px-4 shadow-sm flex-shrink-0">
                            <Hash size={24} className="text-[#72767d] mr-2" />
                            <span className="text-white font-bold mr-4">general</span>
                            <span className="text-[#72767d] text-sm border-l border-[#4f545c] pl-4">The main lounge</span>

                            <div className="ml-auto flex items-center gap-4 text-[#b9bbbe]">
                                <Bell size={20} className="hover:text-[#dcddde] cursor-pointer" />
                                <Users size={20} className={`hover:text-[#dcddde] cursor-pointer ${showUserList ? 'text-[#dcddde]' : ''}`} onClick={() => setShowUserList(!showUserList)} />
                                <div className="relative">
                                    <input placeholder="Search" className="bg-[#202225] text-sm h-6 px-2 rounded w-36 transition-all focus:w-60 text-[#dcddde]" />
                                    <Search size={14} className="absolute right-2 top-1 cursor-pointer" />
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-0 pt-4 pb-0 flex flex-col gap-0.5 custom-scrollbar">
                            {messages.length === 0 ? (
                                <div className="flex-1 flex flex-col justify-end p-4 mb-4">
                                    <div className="w-16 h-16 bg-[#4f545c] rounded-full flex items-center justify-center mb-4"><Hash size={40} className="text-white" /></div>
                                    <h1 className="text-3xl font-bold text-white mb-2">Welcome to #general!</h1>
                                    <p className="text-[#b9bbbe]">This is the start of the #general channel.</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const prevMsg = messages[i - 1];
                                    const isSeq = prevMsg && prevMsg.author.id === msg.author.id && (new Date(msg.created_at) - new Date(prevMsg.created_at) < 60000);
                                    return <DiscordMessage key={msg.id} msg={msg} isSequence={isSeq} user={user} />
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="px-4 pb-6 pt-0 bg-[#36393f]">
                            <div className="bg-[#40444b] rounded-lg items-center flex px-4 py-2.5">
                                <button className="bg-[#b9bbbe] rounded-full p-0.5 text-[#40444b] mr-4 hover:text-[#dcddde] transition"><Plus size={16} strokeWidth={3} /></button>
                                <input
                                    placeholder={`Message #${activeRoom?.name || 'general'}`}
                                    className="bg-transparent flex-1 text-[#dcddde] outline-none font-medium placeholder-[#72767d]"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                            handleSend(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <div className="flex items-center gap-3 text-[#b9bbbe]">
                                    <div className="cursor-pointer hover:text-[#dcddde] hidden sm:block">🎁</div>
                                    <div className="cursor-pointer hover:text-[#dcddde] hidden sm:block">GIF</div>
                                    <div className="cursor-pointer hover:text-[#dcddde]"><Paperclip size={20} /></div>
                                    <div className="cursor-pointer hover:text-[#dcddde]"><Send size={20} /></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Member List */}
                    {showUserList && (
                        <div className="w-60 bg-[#2f3136] flex-shrink-0 hidden lg:flex flex-col overflow-y-auto p-4">
                            <h3 className="text-[#96989d] text-xs font-bold uppercase mb-4">Online — {members.length}</h3>
                            {members.map(member => (
                                <div key={member.id} className="flex items-center gap-3 mb-2 opacity-90 hover:bg-[#36393f] p-1.5 rounded cursor-pointer hover:opacity-100">
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-xs font-bold">
                                            {member.name[0].toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#2f3136] rounded-full flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-white font-medium text-sm">{member.name}</div>
                                        <div className="text-[#b9bbbe] text-xs">Playing VS Code</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            <AnimatePresence>
                {isCreateModalOpen && <CreateServerModal onClose={() => setCreateModalOpen(false)} onCreate={handleCreate} />}
            </AnimatePresence>
        </div>
    );
}

export default App;
