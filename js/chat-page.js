/**
 * @file chat-page.js
 * @description Full-page Chat Application Controller for chat.html
 */

(function () {
  "use strict";

  let currentUser = null;
  let activeConversationId = null;
  let currentTab = "all";
  let searchQuery = "";

  document.addEventListener("DOMContentLoaded", () => {
    initChatPage();
  });

  function initChatPage() {
    currentUser = (typeof window.checkAuth === "function" ? window.checkAuth() : null);
    if (!currentUser || !currentUser.id) {
      if (typeof window.requireAuth === "function") {
        window.requireAuth();
      }
      return;
    }

    // Role badge
    const roleBadge = document.getElementById("chatUserRoleBadge");
    if (roleBadge) {
      const role = currentUser.role || "medical_rep";
      roleBadge.textContent = `${currentUser.name} (${role.toUpperCase().replace("_", " ")})`;
    }

    bindEvents();
    renderConversations();

    // Auto-select first conversation
    const convs = window.ChatService.getConversations(currentUser);
    if (convs.length > 0) {
      selectConversation(convs[0].id);
    } else {
      showEmptyState();
    }

    // Listen for live updates
    window.ChatService.addListener(({ conversationId }) => {
      renderConversations();
      if (activeConversationId && activeConversationId === conversationId) {
        renderMessages(activeConversationId);
      }
    });
  }

  function bindEvents() {
    // Search
    const searchInput = document.getElementById("chatSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        renderConversations();
      });
    }

    // Tabs: All, Direct, Groups
    const tabButtons = [
      document.getElementById("chatTabAll"),
      document.getElementById("chatTabDirect"),
      document.getElementById("chatTabGroups"),
    ];

    tabButtons.forEach((btn) => {
      if (!btn) return;
      btn.addEventListener("click", () => {
        tabButtons.forEach((b) => b && b.classList.remove("active"));
        btn.classList.add("active");
        currentTab = btn.getAttribute("data-tab") || "all";
        renderConversations();
      });
    });

    // Form submit
    const form = document.getElementById("chatFullMessageForm");
    const input = document.getElementById("chatFullTextInput");
    if (form && input) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text && activeConversationId) {
          try {
            window.ChatService.sendMessage(activeConversationId, text);
            input.value = "";
            renderMessages(activeConversationId);
          } catch (err) {
            alert(err.message || "Failed to send message");
          }
        }
      });
    }

    // Mobile Back to contacts button
    const backBtn = document.getElementById("chatBackToContactsBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        const sidebar = document.getElementById("chatSidebarPane");
        const main = document.getElementById("chatMainPane");
        if (sidebar) sidebar.classList.remove("mobile-hidden");
        if (main) main.classList.add("mobile-hidden");
      });
    }

    // Quick Share Doctor Card button
    const shareBtn = document.getElementById("chatQuickShareDoctorBtn");
    if (shareBtn) {
      shareBtn.addEventListener("click", () => {
        promptShareDoctorCard();
      });
    }
  }

  function renderConversations() {
    const listEl = document.getElementById("chatConversationsList");
    if (!listEl || !currentUser) return;

    let convs = window.ChatService.getConversations(currentUser);

    // Filter by Tab
    if (currentTab === "direct") {
      convs = convs.filter((c) => c.type === "direct");
    } else if (currentTab === "group") {
      convs = convs.filter((c) => c.type === "group" || c.type === "announcement");
    }

    // Filter by Search Query
    if (searchQuery) {
      convs = convs.filter((c) => {
        const n = (c.name || "").toLowerCase();
        const na = (c.nameAr || "").toLowerCase();
        return n.includes(searchQuery) || na.includes(searchQuery);
      });
    }

    if (convs.length === 0) {
      listEl.innerHTML = `
        <div class="p-4 text-center text-muted small">
          <svg style="width:32px;height:32px;opacity:0.5;margin-bottom:8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <div>No conversations match your search</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = convs
      .map((c) => {
        const isActive = c.id === activeConversationId;
        const hasUnread = c.unreadCount > 0;
        const lastTxt = c.lastMessage ? c.lastMessage.text : "Start a conversation...";
        const timeStr = c.lastMessage ? formatTime(c.lastMessage.timestamp) : "";

        return `
          <div class="pharma-chat-conv-card ${isActive ? "active-chat" : ""} ${hasUnread ? "has-unread" : ""}" data-conv-id="${escapeHtml(c.id)}" style="${isActive ? "border-color: #0d6efd; background: var(--surface-hover, #f1f5f9);" : ""}">
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
        selectConversation(cid);
      });
    });
  }

  function selectConversation(conversationId) {
    activeConversationId = conversationId;

    const convs = window.ChatService.getConversations(currentUser);
    const conv = convs.find((c) => c.id === conversationId);
    if (!conv) {
      showEmptyState();
      return;
    }

    // Hide empty state, show active content
    const emptyState = document.getElementById("chatEmptyState");
    const activeContent = document.getElementById("chatActiveContent");
    if (emptyState) emptyState.classList.add("d-none");
    if (activeContent) activeContent.classList.remove("d-none");

    // Mobile viewport handling
    const sidebar = document.getElementById("chatSidebarPane");
    const main = document.getElementById("chatMainPane");
    if (sidebar) sidebar.classList.add("mobile-hidden");
    if (main) main.classList.remove("mobile-hidden");

    // Update Header
    const nameEl = document.getElementById("chatActiveName");
    const badgeEl = document.getElementById("chatActiveBadge");
    const avatarEl = document.getElementById("chatActiveAvatar");
    const subEl = document.getElementById("chatActiveSub");

    if (nameEl) nameEl.textContent = conv.name;
    if (badgeEl) badgeEl.textContent = conv.badge || (conv.type === "group" ? "Team Group" : "Direct");
    if (avatarEl) {
      avatarEl.textContent = getInitials(conv.name);
      avatarEl.className = `pharma-chat-avatar-circle ${conv.type === "group" ? "bg-info text-white" : conv.type === "announcement" ? "bg-warning text-dark" : "bg-primary text-white"}`;
    }
    if (subEl) {
      subEl.textContent = conv.type === "group" ? `${conv.participantIds.length} members` : "Available online";
    }

    // Handle canPost: hide message form & action buttons, show readonly banner if false
    const msgForm = document.getElementById("chatFullMessageForm");
    const shareBtn = document.getElementById("chatQuickShareDoctorBtn");
    let fullReadonlyNotice = document.getElementById("chatFullReadonlyNotice");
    if (!fullReadonlyNotice && msgForm && msgForm.parentNode) {
      fullReadonlyNotice = document.createElement("div");
      fullReadonlyNotice.id = "chatFullReadonlyNotice";
      fullReadonlyNotice.className = "pharma-chat-readonly-banner d-none";
      fullReadonlyNotice.innerHTML = `<span>🔒 Only administrators can post in this channel</span>`;
      msgForm.parentNode.insertBefore(fullReadonlyNotice, msgForm);
    }

    if (conv.canPost === false) {
      if (msgForm) msgForm.classList.add("d-none");
      if (fullReadonlyNotice) fullReadonlyNotice.classList.remove("d-none");
      if (shareBtn) shareBtn.classList.add("d-none");
    } else {
      if (msgForm) msgForm.classList.remove("d-none");
      if (fullReadonlyNotice) fullReadonlyNotice.classList.add("d-none");
      if (shareBtn) shareBtn.classList.remove("d-none");
    }

    // Mark as read
    window.ChatService.markAsRead(conversationId, currentUser.id);

    renderConversations();
    renderMessages(conversationId);

    // Focus input
    const input = document.getElementById("chatFullTextInput");
    if (input && conv.canPost !== false) input.focus();
  }

  function renderMessages(conversationId) {
    const area = document.getElementById("chatFullMessagesArea");
    if (!area || !currentUser) return;

    const messages = window.ChatService.getMessages(conversationId);

    if (messages.length === 0) {
      area.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center h-100 text-center text-muted">
          <div class="p-3 bg-primary-subtle text-primary rounded-circle mb-2">
            <svg style="width:32px;height:32px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h6 class="fw-bold">No messages here yet</h6>
          <p class="small text-muted" style="max-width:300px;">Send a message to kick off the team discussion.</p>
        </div>
      `;
      return;
    }

    // Group messages by Date
    let lastDate = "";
    let html = "";

    messages.forEach((m) => {
      const msgDate = new Date(m.timestamp).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
      if (msgDate !== lastDate) {
        lastDate = msgDate;
        html += `
          <div class="pharma-chat-date-separator">
            <span>${msgDate}</span>
          </div>
        `;
      }

      const isMe = m.senderId === currentUser.id;
      const timeStr = formatTime(m.timestamp);

      html += `
        <div class="d-flex mb-2 ${isMe ? "justify-content-end" : "justify-content-start"}">
          <div class="pharma-chat-bubble ${isMe ? "outgoing" : "incoming"}">
            ${!isMe ? `<div class="pharma-chat-sender-name">${escapeHtml(m.senderName)} <span class="text-muted fw-normal" style="font-size:0.68rem;">(${escapeHtml(m.senderRole || "Rep")})</span></div>` : ""}
            <div class="pharma-chat-text">${escapeHtml(m.text)}</div>
            ${renderCardOrAttachment(m)}
            <div class="pharma-chat-time d-flex align-items-center justify-content-end gap-1">
              <span>${timeStr}</span>
              ${isMe ? `<span class="pharma-chat-checkmarks ${m.status === "read" ? "read" : ""}">${m.status === "read" ? "✓✓" : "✓"}</span>` : ""}
            </div>
          </div>
        </div>
      `;
    });

    area.innerHTML = html;
    area.scrollTop = area.scrollHeight;
  }

  function renderCardOrAttachment(m) {
    if (m.sharedCard) {
      return `
        <div class="p-2 mt-2 border rounded bg-surface text-dark small d-flex align-items-center gap-2">
          <div class="p-2 bg-primary-subtle text-primary rounded">🩺</div>
          <div>
            <strong>${escapeHtml(m.sharedCard.title)}</strong>
            <div class="text-muted small">${escapeHtml(m.sharedCard.subtitle || "")}</div>
          </div>
        </div>
      `;
    }
    return "";
  }

  function getScopedDoctorsForUser(user) {
    if (typeof window.getScopedDoctors === "function") {
      try {
        const scoped = window.getScopedDoctors(false);
        if (Array.isArray(scoped) && scoped.length > 0) return scoped;
      } catch (e) {}
    }

    const allDoctors = (window.store && window.store.doctors ? window.store.doctors.getAll() : (window.DEMO_DATA && window.DEMO_DATA.doctors) || []);
    if (!user || !user.id) return [];

    const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);

    // Full access roles (Admin / HR only)
    if (["admin", "hr"].includes(role)) {
      return allDoctors;
    }

    // General Manager / Business Unit: strictly doctors belonging to subordinates under them
    if (role === "general_manager" || role === "gm" || role === "business_unit" || role === "bu") {
      const subs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
      const subIds = subs.map((u) => u.id);
      const subAreaIds = allAreas.filter((a) => (a.repId && subIds.includes(a.repId)) || subIds.includes(a.dmId) || (role === "business_unit" && a.buId === user.id)).map((a) => a.id);
      return allDoctors.filter((d) => (d.repId && subIds.includes(d.repId)) || (d.areaId && subAreaIds.includes(d.areaId)));
    }

    // Medical Rep: only assigned doctors or doctors in user's assigned areas
    if (role === "medical_rep" || role === "rep") {
      const myAreaIds = allAreas.filter((a) => a.repId === user.id).map((a) => a.id);
      return allDoctors.filter((d) => d.repId === user.id || (d.areaId && myAreaIds.includes(d.areaId)));
    }

    // District Manager (DM): doctors of reps under this DM or areas in this DM's territory
    if (role === "district_manager" || role === "dm") {
      const subReps = allUsers.filter((u) => u.managerId === user.id);
      const subRepIds = subReps.map((u) => u.id);
      const dmAreaIds = allAreas.filter((a) => a.dmId === user.id || (a.repId && subRepIds.includes(a.repId))).map((a) => a.id);
      return allDoctors.filter((d) => (d.repId && subRepIds.includes(d.repId)) || (d.areaId && dmAreaIds.includes(d.areaId)));
    }

    // Line Manager (LM): doctors belonging to areas in LM's product lines
    if (role === "line_manager" || role === "lm") {
      const myLineIds = user.lineIds || (user.lineId ? [user.lineId] : []);
      const lineAreaIds = allAreas.filter((a) => a.lineId && myLineIds.includes(a.lineId)).map((a) => a.id);
      return allDoctors.filter((d) => (d.lineId && myLineIds.includes(d.lineId)) || (d.areaId && lineAreaIds.includes(d.areaId)));
    }

    // Default fallback: return assigned doctors
    return allDoctors.filter((d) => d.repId === user.id);
  }

  function promptShareDoctorCard() {
    if (!activeConversationId) return;

    const docs = getScopedDoctorsForUser(currentUser);

    if (!docs || docs.length === 0) {
      alert("No accessible doctors available in your territory to share.");
      return;
    }

    const maxItems = Math.min(10, docs.length);
    const docNames = docs.slice(0, maxItems).map((d, i) => `${i + 1}. ${d.name} (${d.specialty || "Doctor"})`).join("\n");
    const pick = prompt(`Select a doctor to share in this chat:\n\n${docNames}\n\nEnter number (1-${maxItems}):`);
    const num = parseInt(pick, 10);
    if (!isNaN(num) && num >= 1 && num <= maxItems) {
      const selectedDoc = docs[num - 1];
      try {
        window.ChatService.sendMessage(activeConversationId, `Shared doctor contact card: ${selectedDoc.name}`, {
          sharedCard: {
            type: "doctor",
            id: selectedDoc.id,
            title: selectedDoc.name,
            subtitle: `${selectedDoc.specialty || "Specialist"} - ${selectedDoc.clinicAddress || selectedDoc.area || "Clinic"}`
          }
        });
        renderMessages(activeConversationId);
      } catch (err) {
        alert(err.message || "Failed to share doctor card");
      }
    }
  }

  function showEmptyState() {
    const emptyState = document.getElementById("chatEmptyState");
    const activeContent = document.getElementById("chatActiveContent");
    const shareBtn = document.getElementById("chatQuickShareDoctorBtn");
    if (emptyState) emptyState.classList.remove("d-none");
    if (activeContent) activeContent.classList.add("d-none");
    if (shareBtn) shareBtn.classList.add("d-none");
  }

  function formatTime(isoStr) {
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
})();
