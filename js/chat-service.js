/**
 * @file chat-service.js
 * @description Enterprise Real-time Chat Engine for PharmaCare CRM & ERP.
 * Supports 1-to-1 direct messaging, organizational hierarchy groups,
 * unread badges, floating chat widget across all pages, and full chat page view.
 */

(function () {
  "use strict";

  const STORAGE_KEYS = {
    MESSAGES: "pharma_chat_messages_v1",
    CONVERSATIONS: "pharma_chat_conversations_v1",
    LAST_ACTIVE: "pharma_chat_last_active_conv",
  };

  // Helper for unique ID generation
  function genId(prefix = "msg_") {
    return prefix + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  class ChatServiceEngine {
    constructor() {
      this.listeners = new Set();
      this.activeConversationId = null;
      this.initStore();
    }

    initStore() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
        if (!raw) {
          localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
        } else {
          // Clean out any legacy mock messages if present
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const cleaned = parsed.filter((m) => !m.id || !String(m.id).startsWith("msg_init_"));
              if (cleaned.length !== parsed.length) {
                localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(cleaned));
              }
            }
          } catch (e) {}
        }
      } catch (err) {
        console.warn("[ChatService] LocalStorage unavailable:", err);
      }
    }

    getAllStoredMessages() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
        return raw ? JSON.parse(raw) : [];
      } catch (err) {
        return [];
      }
    }

    saveAllMessages(messages) {
      try {
        const MAX_STORED_MESSAGES = 500;
        let toSave = Array.isArray(messages) ? messages : [];
        if (toSave.length > MAX_STORED_MESSAGES) {
          // Keep the newest 500 messages (FIFO)
          toSave = toSave.slice(toSave.length - MAX_STORED_MESSAGES);
        }
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(toSave));
      } catch (err) {
        console.warn("[ChatService] Storage error, attempting emergency trim:", err);
        try {
          // Emergency recovery if storage is full: keep only newest 100 messages
          const emergencyTrim = (Array.isArray(messages) ? messages : []).slice(-100);
          localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(emergencyTrim));
        } catch (innerErr) {
          console.error("[ChatService] Failed to persist messages even after emergency trim:", innerErr);
        }
      }
    }

    /**
     * Resolves conversations automatically based on organization hierarchy,
     * product line assignments, and user reporting trees.
     */
    getConversations(currentUser) {
      if (!currentUser || !currentUser.id) return [];

      const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
      const userRole = (window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || "").toLowerCase());
      const allMessages = this.getAllStoredMessages();

      const conversations = [];

      // 1. Company Announcements Group (Global)
      conversations.push({
        id: "group_announcements",
        type: "announcement",
        category: "group",
        name: "Company Announcements",
        nameAr: "إعلانات وتعليمات الشركة",
        badge: "Company-Wide",
        badgeClass: "badge-announcement",
        avatarIcon: "📢",
        avatarClass: "avatar-announcement",
        participantIds: allUsers.map((u) => u.id),
        canPost: ["admin", "hr"].includes(userRole),
      });

      // 2. Direct Manager Conversation (if user has a manager)
      if (currentUser.managerId) {
        const mgr = allUsers.find((u) => u.id === currentUser.managerId);
        if (mgr) {
          const convId = this.getDirectConvId(currentUser.id, mgr.id);
          conversations.push({
            id: convId,
            type: "direct",
            category: "direct",
            targetUserId: mgr.id,
            name: `${mgr.name} (${mgr.role ? mgr.role.toUpperCase() : "Manager"})`,
            nameAr: `${mgr.nameAr || mgr.name} (المدير المباشر)`,
            badge: "Direct Manager",
            badgeClass: "badge-direct",
            avatarIcon: getInitials(mgr.name),
            avatarClass: "avatar-direct",
            participantIds: [currentUser.id, mgr.id],
            canPost: true,
          });
        }
      }

      // 3. District Team Groups
      const dmUsersForGroups = [];
      if (userRole === "district_manager" || userRole === "dm") {
        dmUsersForGroups.push(currentUser);
      } else if (userRole === "medical_rep" || userRole === "rep") {
        const myMgr = allUsers.find((u) => u.id === currentUser.managerId);
        if (myMgr) dmUsersForGroups.push(myMgr);
      } else if (userRole === "line_manager" || userRole === "lm") {
        const myDMs = allUsers.filter((u) => u.managerId === currentUser.id && (u.role === "district_manager" || u.role === "dm"));
        dmUsersForGroups.push(...myDMs);
      } else if (userRole === "general_manager" || userRole === "gm" || userRole === "business_unit" || userRole === "bu") {
        const mySubs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(currentUser.id) : [];
        const mySubDMs = mySubs.filter((u) => {
          const ur = window.normalizeRole ? window.normalizeRole(u.role) : String(u.role || "").toLowerCase();
          return ur === "district_manager" || ur === "dm";
        });
        dmUsersForGroups.push(...mySubDMs);
      } else if (["admin", "hr"].includes(userRole)) {
        const allDMs = allUsers.filter((u) => {
          const ur = window.normalizeRole ? window.normalizeRole(u.role) : String(u.role || "").toLowerCase();
          return ur === "district_manager" || ur === "dm";
        });
        dmUsersForGroups.push(...allDMs);
      }

      dmUsersForGroups.forEach((dmUser) => {
        const dmId = dmUser.id;
        const districtReps = allUsers.filter((u) => u.managerId === dmId);
        const teamName = `${dmUser.name}'s District Team`;
        const teamNameAr = `فريق منطقة (${dmUser.nameAr || dmUser.name})`;
        conversations.push({
          id: `group_district_${dmId}`,
          type: "group",
          category: "group",
          name: teamName,
          nameAr: teamNameAr,
          badge: "District Team",
          badgeClass: "badge-district",
          avatarIcon: "👥",
          avatarClass: "avatar-district",
          participantIds: [dmId, ...districtReps.map((r) => r.id)],
          canPost: true,
        });
      });

      // 4. Product Line Groups
      let userLines = [];
      if (typeof window.getUserLines === "function") {
        try {
          userLines = window.getUserLines(currentUser.id) || [];
        } catch (e) {}
      }

      const allProductLines = (window.store && window.store.productLines
        ? window.store.productLines.getAll()
        : (window.DEMO_DATA && window.DEMO_DATA.productLines) || []);

      if ((!userLines || userLines.length === 0) && allProductLines.length > 0) {
        const uLineIds = currentUser.lineIds || (currentUser.lineId ? [currentUser.lineId] : []);
        userLines = allProductLines.filter((l) => uLineIds.includes(l.id));
      }

      // Admin and HR see all lines (GM and BU remain scoped to their subordinates' lines)
      if (["admin", "hr"].includes(userRole)) {
        userLines = allProductLines;
      }

      // Friendly fallback dictionary for standard system product lines
      if (!userLines || userLines.length === 0) {
        const uLineIds = currentUser.lineIds || (currentUser.lineId ? [currentUser.lineId] : []);
        const fallbackNames = {
          "line_1790626000001": { name: "Pioneers Line", nameAr: "خط الرواد (Pioneers)" },
          "line_1790626000002": { name: "Challengers Line", nameAr: "خط المتحدين (Challengers)" },
          "line1": { name: "Pioneers Line", nameAr: "خط الرواد (Pioneers)" },
          "line2": { name: "Challengers Line", nameAr: "خط المتحدين (Challengers)" },
        };
        userLines = [];
        uLineIds.forEach((lid) => {
          const fb = fallbackNames[lid] || { name: `Line ${lid}`, nameAr: `خط ${lid}` };
          userLines.push({ id: lid, name: fb.name, nameAr: fb.nameAr });
        });
      }

      userLines.forEach((lineObj) => {
        const lid = lineObj.id;
        const lineName = lineObj.name || lineObj.nameAr || `Line ${lid}`;
        const lineNameAr = lineObj.nameAr || lineObj.name || `مجموعة خط ${lineName}`;
        const lineUsers = allUsers.filter((u) => {
          const uLids = u.lineIds || (u.lineId ? [u.lineId] : []);
          return uLids.includes(lid);
        });

        conversations.push({
          id: `group_line_${lid}`,
          type: "group",
          category: "group",
          name: `${lineName} Team Group`,
          nameAr: `مجموعة ${lineNameAr}`,
          badge: "Product Line",
          badgeClass: "badge-line",
          avatarIcon: "🧬",
          avatarClass: "avatar-line",
          participantIds: lineUsers.map((u) => u.id),
          canPost: true,
        });
      });

      // 5. Direct Conversations with Subordinates (if user is a Manager)
      const directSubordinates = allUsers.filter((u) => u.managerId === currentUser.id && u.id !== currentUser.id);
      directSubordinates.forEach((sub) => {
        const convId = this.getDirectConvId(currentUser.id, sub.id);
        const exists = conversations.some((c) => c.id === convId);
        if (!exists) {
          conversations.push({
            id: convId,
            type: "direct",
            category: "direct",
            targetUserId: sub.id,
            name: `${sub.name} (${sub.employeeCode || sub.role || "Team"})`,
            nameAr: `${sub.nameAr || sub.name}`,
            badge: sub.role ? sub.role.toUpperCase() : "Member",
            badgeClass: "badge-direct",
            avatarIcon: getInitials(sub.name),
            avatarClass: "avatar-direct",
            participantIds: [currentUser.id, sub.id],
            canPost: true,
          });
        }
      });

      // 6. Direct Conversation with HR (Available for all employees)
      if (userRole !== "hr") {
        const hrUsers = allUsers.filter((u) => {
          const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || "").toLowerCase();
          return r === "hr";
        });
        hrUsers.forEach((hr) => {
          const convId = this.getDirectConvId(currentUser.id, hr.id);
          const exists = conversations.some((c) => c.id === convId);
          if (!exists) {
            conversations.push({
              id: convId,
              type: "direct",
              category: "direct",
              targetUserId: hr.id,
              name: `HR Support - ${hr.name}`,
              nameAr: `الدعم والموارد البشرية - ${hr.nameAr || hr.name}`,
              badge: "HR Support",
              badgeClass: "badge-hr",
              avatarIcon: "🛡️",
              avatarClass: "avatar-hr",
              participantIds: [currentUser.id, hr.id],
              canPost: true,
            });
          }
        });
      }

      // Attach lastMessage and unreadCounts
      conversations.forEach((conv) => {
        const msgs = allMessages.filter((m) => m.conversationId === conv.id);
        if (msgs.length > 0) {
          // Sort chronologically
          msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          conv.lastMessage = msgs[msgs.length - 1];
        } else {
          conv.lastMessage = null;
        }

        // Compute unread count for current user (support multi-user readBy)
        const unread = msgs.filter((m) => {
          if (m.senderId === currentUser.id) return false;
          if (Array.isArray(m.readBy)) {
            return !m.readBy.includes(currentUser.id);
          }
          return m.status !== "read";
        }).length;
        conv.unreadCount = unread;
      });

      // Sort conversations: unread first, then by last message timestamp
      conversations.sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
        const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
        return timeB - timeA;
      });

      return conversations;
    }

    getDirectConvId(uid1, uid2) {
      const sorted = [String(uid1), String(uid2)].sort();
      return `direct_${sorted[0]}_${sorted[1]}`;
    }

    getMessages(conversationId) {
      if (!conversationId) return [];
      const currentUser = (typeof window.checkAuth === "function" ? window.checkAuth() : null);
      if (!currentUser || !currentUser.id) return [];

      // Verify user has permission to access this conversation
      const convs = this.getConversations(currentUser);
      const isAllowed = convs.some((c) => c.id === conversationId);
      if (!isAllowed) {
        console.warn(`[ChatService] Access denied: User ${currentUser.id} is not a member of ${conversationId}`);
        return [];
      }

      const all = this.getAllStoredMessages();
      const msgs = all.filter((m) => m.conversationId === conversationId);
      msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return msgs;
    }

    sendMessage(conversationId, text, options = {}) {
      const currentUser = (typeof window.checkAuth === "function" ? window.checkAuth() : null);
      if (!currentUser || !currentUser.id) {
        throw new Error("Must be logged in to send messages");
      }
      if (!text || !text.trim()) {
        return null;
      }

      // Security & Permission Enforcement: Check membership and canPost
      const convs = this.getConversations(currentUser);
      const conv = convs.find((c) => c.id === conversationId);
      if (!conv) {
        throw new Error("Access denied: You are not a participant in this conversation.");
      }
      if (conv.canPost === false) {
        throw new Error("Permission denied: You do not have permission to post in this channel.");
      }

      const all = this.getAllStoredMessages();
      const now = new Date();
      const newMsg = {
        id: genId("msg_"),
        conversationId,
        senderId: currentUser.id,
        senderName: currentUser.name || "Employee",
        senderRole: currentUser.role || "rep",
        text: text.trim(),
        timestamp: now.toISOString(),
        status: "sent",
        readBy: [currentUser.id],
        sharedCard: options.sharedCard || null,
      };

      all.push(newMsg);
      this.saveAllMessages(all);

      // Notify in-process listeners
      this.dispatchChange(conversationId, newMsg);

      // Play soft sound if supported
      this.playNotificationSound();

      return newMsg;
    }

    markAsRead(conversationId, userId) {
      if (!conversationId || !userId) return;
      const all = this.getAllStoredMessages();
      let updated = false;
      all.forEach((m) => {
        if (m.conversationId === conversationId && m.senderId !== userId) {
          if (!Array.isArray(m.readBy)) {
            m.readBy = m.status === "read" ? [userId] : [];
          }
          if (!m.readBy.includes(userId)) {
            m.readBy.push(userId);
            updated = true;
          }
          if (m.status !== "read") {
            m.status = "read";
            updated = true;
          }
        }
      });
      if (updated) {
        this.saveAllMessages(all);
        this.dispatchChange(conversationId, null);
      }
    }

    getTotalUnreadCount(currentUser) {
      if (!currentUser || !currentUser.id) return 0;
      const convs = this.getConversations(currentUser);
      return convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    }

    addListener(cb) {
      this.listeners.add(cb);
      return () => this.listeners.delete(cb);
    }

    dispatchChange(conversationId, newMsg) {
      if (typeof CustomEvent !== "undefined" && typeof document !== "undefined" && document.dispatchEvent) {
        document.dispatchEvent(
          new CustomEvent("pharma:chat:updated", {
            detail: { conversationId, message: newMsg },
          })
        );
      }
      this.listeners.forEach((cb) => {
        try {
          cb({ conversationId, message: newMsg });
        } catch (e) {
          console.warn("[ChatService] Listener error:", e);
        }
      });
    }

    playNotificationSound() {
      try {
        if (!this.audioCtx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioContextClass) return;
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === "suspended") {
          this.audioCtx.resume();
        }
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.15);
      } catch (e) {
        // AudioContext disabled or not permitted
      }
    }
  }

  // Instantiate and expose globally
  window.ChatService = new ChatServiceEngine();

  // ==========================================================================
  // Global Floating Chat Widget Injector
  // Discrete, 100% self-contained enterprise floating widget
  // ==========================================================================
  let currentPopupConvId = null;
  let currentPopupTab = "all";
  let currentPopupSearchQuery = "";

  function injectFloatingChatWidget() {
    if (document.getElementById("pharmaFloatingChatContainer")) return;
    const path = window.location.pathname.toLowerCase();
    const isExcludedPage = path.includes("login.html") || path.includes("chat.html");
    if (isExcludedPage) return;

    const user = (typeof window.checkAuth === "function" ? window.checkAuth() : null);
    if (!user || !user.id) return;

    const container = document.createElement("div");
    container.id = "pharmaFloatingChatContainer";
    container.className = "pharma-chat-floating-container";
    container.innerHTML = `
      <!-- Floating Popup Window -->
      <div id="pharmaChatFloatingPopup" class="pharma-chat-popup">
        <!-- Header -->
        <div class="pharma-chat-popup-header">
          <div class="pharma-chat-header-info">
            <button type="button" id="pharmaChatPopupBackBtn" class="pharma-chat-header-btn pharma-chat-hidden" title="Back to Conversations" aria-label="Back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div class="pharma-chat-header-avatar" id="pharmaChatPopupHeaderAvatar">
              <span id="pharmaChatPopupHeaderAvatarText">💬</span>
            </div>
            <div class="pharma-chat-header-titles">
              <div id="pharmaChatPopupTitle" class="pharma-chat-header-title">PharmaCare Team Chat</div>
              <div id="pharmaChatPopupSubtitle" class="pharma-chat-header-sub">Online • Field & Medical Team</div>
            </div>
          </div>
          <div class="pharma-chat-header-actions">
            <a href="chat.html" class="pharma-chat-header-btn" title="Open Full Screen Chat" aria-label="Open Full Chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            </a>
            <button type="button" id="pharmaChatPopupCloseBtn" class="pharma-chat-header-btn" title="Minimize Chat" aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- VIEW 1: Conversations List & Search & Tabs -->
        <div id="pharmaChatPopupConvsView" class="pharma-chat-view">
          <!-- Filter Tabs -->
          <div class="pharma-chat-tabs-bar">
            <button type="button" class="pharma-chat-tab-btn active" data-tab="all" id="pharmaChatTabAll">
              <span>All</span>
            </button>
            <button type="button" class="pharma-chat-tab-btn" data-tab="group" id="pharmaChatTabGroups">
              <span>👥 Teams</span>
            </button>
            <button type="button" class="pharma-chat-tab-btn" data-tab="direct" id="pharmaChatTabDirect">
              <span>👤 Direct</span>
            </button>
          </div>

          <!-- Search Bar -->
          <div class="pharma-chat-search-wrap">
            <svg class="pharma-chat-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="pharmaChatPopupSearch" class="pharma-chat-search-input" placeholder="Search teams & colleagues..." />
          </div>

          <!-- Conversations Items List -->
          <div id="pharmaChatPopupConvsItems" class="pharma-chat-convs-scroll-list"></div>
        </div>

        <!-- VIEW 2: Active Chat Messages Screen -->
        <div id="pharmaChatPopupMessagesView" class="pharma-chat-view pharma-chat-hidden">
          <!-- Messages List -->
          <div id="pharmaChatPopupMessagesContainer" class="pharma-chat-messages-scroll-area"></div>

          <!-- Input Bar -->
          <form id="pharmaChatPopupForm" class="pharma-chat-bottom-input-bar">
            <input type="text" id="pharmaChatPopupInput" class="pharma-chat-bottom-input" placeholder="Type a message..." autocomplete="off" />
            <button type="submit" class="pharma-chat-send-btn" title="Send Message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </form>
        </div>
      </div>

      <!-- Floating Trigger Button -->
      <button type="button" id="pharmaChatFloatingBtn" class="pharma-chat-floating-btn" title="Open Team Chat" aria-label="Open Chat">
        <svg class="pharma-chat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span id="pharmaChatUnreadBadge" class="pharma-chat-badge pharma-chat-hidden">0</span>
      </button>
    `;

    document.body.appendChild(container);
    bindFloatingChatEvents();
    updateFloatingUnreadBadge();
  }

  function bindFloatingChatEvents() {
    const floatBtn = document.getElementById("pharmaChatFloatingBtn");
    const popup = document.getElementById("pharmaChatFloatingPopup");
    const closeBtn = document.getElementById("pharmaChatPopupCloseBtn");
    const backBtn = document.getElementById("pharmaChatPopupBackBtn");
    const searchInput = document.getElementById("pharmaChatPopupSearch");
    const form = document.getElementById("pharmaChatPopupForm");
    const input = document.getElementById("pharmaChatPopupInput");

    // Toggle Popup Open / Close
    if (floatBtn && popup) {
      floatBtn.addEventListener("click", () => {
        const isOpen = popup.classList.contains("is-open");
        if (isOpen) {
          popup.classList.remove("is-open");
        } else {
          popup.classList.add("is-open");
          if (!currentPopupConvId) {
            showPopupConversationsList();
          } else {
            renderPopupMessages(currentPopupConvId);
          }
          updateFloatingUnreadBadge();
        }
      });
    }

    if (closeBtn && popup) {
      closeBtn.addEventListener("click", () => {
        popup.classList.remove("is-open");
      });
    }

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        currentPopupConvId = null;
        showPopupConversationsList();
      });
    }

    // Tabs inside floating widget
    const tabBtns = popup ? popup.querySelectorAll(".pharma-chat-tab-btn") : [];
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentPopupTab = btn.getAttribute("data-tab") || "all";
        renderPopupConversationsList(currentPopupSearchQuery);
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        currentPopupSearchQuery = e.target.value.trim().toLowerCase();
        renderPopupConversationsList(currentPopupSearchQuery);
      });
    }

    if (form && input) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text && currentPopupConvId) {
          try {
            window.ChatService.sendMessage(currentPopupConvId, text);
            input.value = "";
            renderPopupMessages(currentPopupConvId);
          } catch (err) {
            alert(err.message || "Failed to send message");
          }
        }
      });
    }

    // Listen for live updates
    window.ChatService.addListener(({ conversationId }) => {
      updateFloatingUnreadBadge();
      if (currentPopupConvId && currentPopupConvId === conversationId) {
        renderPopupMessages(currentPopupConvId);
      } else {
        renderPopupConversationsList(currentPopupSearchQuery);
      }
    });
  }

  function updateFloatingUnreadBadge() {
    const badge = document.getElementById("pharmaChatUnreadBadge");
    if (!badge) return;
    const user = (typeof window.checkAuth === "function" ? window.checkAuth() : null);
    if (!user) return;
    const total = window.ChatService.getTotalUnreadCount(user);
    if (total > 0) {
      badge.textContent = total > 99 ? "99+" : total;
      badge.classList.remove("pharma-chat-hidden");
    } else {
      badge.classList.add("pharma-chat-hidden");
    }
  }

  function showPopupConversationsList() {
    const convsView = document.getElementById("pharmaChatPopupConvsView");
    const msgsView = document.getElementById("pharmaChatPopupMessagesView");
    const backBtn = document.getElementById("pharmaChatPopupBackBtn");
    const title = document.getElementById("pharmaChatPopupTitle");
    const sub = document.getElementById("pharmaChatPopupSubtitle");
    const avatar = document.getElementById("pharmaChatPopupHeaderAvatarText");
    const form = document.getElementById("pharmaChatPopupForm");
    const readonlyNotice = document.getElementById("pharmaChatPopupReadonlyNotice");

    if (readonlyNotice) readonlyNotice.classList.add("pharma-chat-hidden");
    if (form) form.classList.remove("pharma-chat-hidden");

    if (convsView) convsView.classList.remove("pharma-chat-hidden");
    if (msgsView) msgsView.classList.add("pharma-chat-hidden");
    if (backBtn) backBtn.classList.add("pharma-chat-hidden");
    if (title) title.textContent = "PharmaCare Team Chat";
    if (sub) sub.textContent = "Online • Field & Medical Team";
    if (avatar) avatar.textContent = "💬";

    renderPopupConversationsList(currentPopupSearchQuery);
  }

  function renderPopupConversationsList(query = "") {
    const listEl = document.getElementById("pharmaChatPopupConvsItems");
    if (!listEl) return;

    const user = (typeof window.checkAuth === "function" ? window.checkAuth() : null);
    if (!user) return;

    let convs = window.ChatService.getConversations(user);

    // Filter by tab
    if (currentPopupTab === "group") {
      convs = convs.filter((c) => c.type === "group" || c.type === "announcement");
    } else if (currentPopupTab === "direct") {
      convs = convs.filter((c) => c.type === "direct");
    }

    // Filter by search query
    const q = (query || "").toLowerCase().trim();
    if (q) {
      convs = convs.filter((c) => {
        return (c.name && c.name.toLowerCase().includes(q)) || (c.nameAr && c.nameAr.toLowerCase().includes(q));
      });
    }

    if (convs.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 24px; text-align: center; color: #94a3b8; font-size: 0.85rem;">
          <div style="font-size: 1.8rem; margin-bottom: 6px;">🔍</div>
          <div>No conversations match your search</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = convs
      .map((c) => {
        const hasUnread = c.unreadCount > 0;
        const lastTxt = c.lastMessage ? c.lastMessage.text : "Start a conversation...";
        const timeStr = c.lastMessage ? formatChatTime(c.lastMessage.timestamp) : "";

        return `
          <div class="pharma-chat-conv-card ${hasUnread ? "has-unread" : ""}" data-conv-id="${escapeHtml(c.id)}">
            <div class="pharma-chat-conv-left">
              <div class="pharma-chat-avatar ${escapeHtml(c.avatarClass || "avatar-direct")}">
                ${escapeHtml(c.avatarIcon || getInitials(c.name))}
              </div>
              <div class="pharma-chat-conv-text">
                <div class="pharma-chat-conv-title-row">
                  <span class="pharma-chat-conv-name">${escapeHtml(c.name)}</span>
                  ${c.badge ? `<span class="pharma-chat-badge-pill ${escapeHtml(c.badgeClass || "badge-direct")}">${escapeHtml(c.badge)}</span>` : ""}
                </div>
                <div class="pharma-chat-conv-snippet">${escapeHtml(lastTxt)}</div>
              </div>
            </div>
            <div class="pharma-chat-conv-right">
              <span class="pharma-chat-conv-time">${timeStr}</span>
              ${hasUnread ? `<span class="pharma-chat-unread-count">${c.unreadCount}</span>` : ""}
            </div>
          </div>
        `;
      })
      .join("");

    listEl.querySelectorAll(".pharma-chat-conv-card").forEach((el) => {
      el.addEventListener("click", () => {
        const cid = el.getAttribute("data-conv-id");
        openPopupConversation(cid);
      });
    });
  }

  function openPopupConversation(conversationId) {
    currentPopupConvId = conversationId;
    const user = (typeof window.checkAuth === "function" ? window.checkAuth() : null);
    if (!user) return;

    const convs = window.ChatService.getConversations(user);
    const conv = convs.find((c) => c.id === conversationId);

    const convsView = document.getElementById("pharmaChatPopupConvsView");
    const msgsView = document.getElementById("pharmaChatPopupMessagesView");
    const backBtn = document.getElementById("pharmaChatPopupBackBtn");
    const title = document.getElementById("pharmaChatPopupTitle");
    const sub = document.getElementById("pharmaChatPopupSubtitle");
    const avatar = document.getElementById("pharmaChatPopupHeaderAvatarText");

    if (convsView) convsView.classList.add("pharma-chat-hidden");
    if (msgsView) msgsView.classList.remove("pharma-chat-hidden");
    if (backBtn) backBtn.classList.remove("pharma-chat-hidden");

    if (conv) {
      if (title) title.textContent = conv.name;
      if (sub) sub.textContent = conv.badge || (conv.type === "group" ? "Team Group" : "Direct Message");
      if (avatar) avatar.textContent = conv.avatarIcon || getInitials(conv.name);
    }

    // Handle canPost permission: hide form and show readonly notice if false
    const form = document.getElementById("pharmaChatPopupForm");
    let readonlyNotice = document.getElementById("pharmaChatPopupReadonlyNotice");
    if (!readonlyNotice && form && form.parentNode) {
      readonlyNotice = document.createElement("div");
      readonlyNotice.id = "pharmaChatPopupReadonlyNotice";
      readonlyNotice.className = "pharma-chat-readonly-banner pharma-chat-hidden";
      readonlyNotice.innerHTML = `<span>🔒 Only administrators can post in this channel</span>`;
      form.parentNode.insertBefore(readonlyNotice, form);
    }

    if (conv && conv.canPost === false) {
      if (form) form.classList.add("pharma-chat-hidden");
      if (readonlyNotice) readonlyNotice.classList.remove("pharma-chat-hidden");
    } else {
      if (form) form.classList.remove("pharma-chat-hidden");
      if (readonlyNotice) readonlyNotice.classList.add("pharma-chat-hidden");
    }

    window.ChatService.markAsRead(conversationId, user.id);
    updateFloatingUnreadBadge();
    renderPopupMessages(conversationId);
  }

  function renderPopupMessages(conversationId) {
    const container = document.getElementById("pharmaChatPopupMessagesContainer");
    if (!container) return;

    const user = (typeof window.checkAuth === "function" ? window.checkAuth() : null);
    if (!user) return;

    const messages = window.ChatService.getMessages(conversationId);

    if (messages.length === 0) {
      container.innerHTML = `
        <div style="margin: auto; text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 20px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">👋</div>
          <div>No messages here yet</div>
          <div style="font-size: 0.78rem; margin-top: 4px;">Send a message to start the conversation</div>
        </div>
      `;
      return;
    }

    container.innerHTML = messages
      .map((m) => {
        const isMe = m.senderId === user.id;
        const timeStr = formatChatTime(m.timestamp);
        return `
          <div class="pharma-chat-bubble-row ${isMe ? "outgoing" : "incoming"}">
            <div class="pharma-chat-bubble ${isMe ? "outgoing" : "incoming"}">
              ${!isMe ? `<div class="pharma-chat-sender-name">${escapeHtml(m.senderName)}</div>` : ""}
              <div class="pharma-chat-bubble-text">${escapeHtml(m.text)}</div>
              ${renderWidgetSharedCard(m)}
              <div class="pharma-chat-bubble-meta">
                <span>${timeStr}</span>
                ${isMe ? `<span class="pharma-chat-checkmarks ${m.status === "read" ? "read" : ""}">${m.status === "read" ? "✓✓" : "✓"}</span>` : ""}
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    container.scrollTop = container.scrollHeight;
  }

  function renderWidgetSharedCard(m) {
    if (!m || !m.sharedCard) return "";
    return `
      <div style="margin-top:6px; padding:6px 8px; border-radius:6px; background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.08); font-size: 0.78rem; display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 1rem;">🩺</span>
        <div style="overflow: hidden; text-align: left;">
          <div style="font-weight: 600; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${escapeHtml(m.sharedCard.title)}</div>
          <div style="font-size: 0.7rem; opacity: 0.8; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${escapeHtml(m.sharedCard.subtitle || "")}</div>
        </div>
      </div>
    `;
  }

  // Utilities
  function formatChatTime(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function getInitials(name) {
    if (!name) return "P";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Auto-boot floating widget after DOM loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(injectFloatingChatWidget, 300);
    });
  } else {
    setTimeout(injectFloatingChatWidget, 300);
  }
})();
