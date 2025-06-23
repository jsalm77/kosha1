// ===== Player Page Logic =====

document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    const playerNavBtns = document.querySelectorAll(".player-nav .nav-btn");
    const tabContents = document.querySelectorAll(".tab-content");
    const playerNameHeader = document.getElementById("playerNameHeader");

    // Team Tab Elements
    const teamPlayersList = document.getElementById("teamPlayersList");
    const upcomingMatchesList = document.getElementById("upcomingMatchesList");
    const calendarContainer = document.getElementById("calendarContainer");

    // Posts Tab Elements
    const postContentInput = document.getElementById("postContent");
    const createPostBtn = document.getElementById("createPostBtn");
    const postsFeed = document.getElementById("postsFeed");

    // Chat Tab Elements
    const chatTabBtns = document.querySelectorAll(".chat-tab-btn");
    const generalChatSection = document.getElementById("general-chat-section");
    const privateChatSection = document.getElementById("private-chat-section");
    const generalChatMessageInput = document.getElementById("generalChatMessageInput");
    const sendGeneralChatBtn = document.getElementById("sendGeneralChatBtn");
    const generalChatMessages = document.getElementById("generalChatMessages");
    const generalChatTypingIndicator = document.getElementById("generalChatTypingIndicator");
    const privateChatSearchInput = document.getElementById("privateChatSearchInput");
    const privateChatUsersList = document.getElementById("privateChatUsersList");
    const privateChatHeader = document.getElementById("privateChatHeader");
    const privateChatRecipientName = document.getElementById("privateChatRecipientName");
    const privateChatMessages = document.getElementById("privateChatMessages");
    const privateChatMessageInput = document.getElementById("privateChatMessageInput");
    const sendPrivateChatBtn = document.getElementById("sendPrivateChatBtn");
    const privateChatInputArea = document.getElementById("privateChatInputArea");
    const privateChatTypingIndicator = document.getElementById("privateChatTypingIndicator");

    // Profile Tab Elements
    const profileName = document.getElementById("profileName");
    const profileCode = document.getElementById("profileCode");
    const profilePosition = document.getElementById("profilePosition");
    const profileNumber = document.getElementById("profileNumber");
    const profileAvatar = document.getElementById("profileAvatar");

    let loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    let currentPrivateChatRecipient = null;
    let typingTimeout = null;

    // Check if player is logged in
    if (!loggedInUser || loggedInUser.type !== "player") {
        window.location.href = "index.html";
        return;
    }

    playerNameHeader.textContent = loggedInUser.name;

    // Set player online status
    FCWolves.database.ref(`players/${loggedInUser.id}/online`).onDisconnect().set(false);
    FCWolves.database.ref(`players/${loggedInUser.id}/online`).set(true);

    // Logout functionality
    logoutBtn.addEventListener("click", () => {
        FCWolves.database.ref(`players/${loggedInUser.id}/online`).set(false);
        localStorage.removeItem("userType");
        localStorage.removeItem("loggedInUser");
        window.location.href = "index.html";
    });

    // Tab switching functionality
    playerNavBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            playerNavBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            tabContents.forEach(content => content.classList.remove("active"));
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add("active");
        });
    });

    // --- Team Tab ---
    // Display players with online status
    FCWolves.database.ref("players").on("value", (snapshot) => {
        teamPlayersList.innerHTML = "";
        snapshot.forEach((childSnapshot) => {
            const player = childSnapshot.val();
            const playerId = childSnapshot.key;
            const playerCard = document.createElement("div");
            playerCard.className = "player-card card";
            playerCard.innerHTML = `
                <h3>${player.name}</h3>
                <p>المركز: ${player.position}</p>
                <p>الرقم: ${player.number}</p>
                <span class="online-indicator" style="color: ${player.online ? 'green' : 'gray'};"><i class="fas fa-circle"></i></span>
            `;
            teamPlayersList.appendChild(playerCard);
        });
    });

    // Display upcoming matches
    FCWolves.database.ref("matches").on("value", (snapshot) => {
        upcomingMatchesList.innerHTML = "";
        snapshot.forEach((childSnapshot) => {
            const match = childSnapshot.val();
            const matchId = childSnapshot.key;
            const matchItem = document.createElement("div");
            matchItem.className = "match-item card";
            matchItem.innerHTML = `
                <h4>${match.opponent} (${match.type})</h4>
                <p>التاريخ: ${match.date} الوقت: ${match.time}</p>
                <p>المكان: ${match.location}</p>
                <div class="comment-section">
                    <textarea class="comment-input" placeholder="أضف تعليقك على المباراة..." data-match-id="${matchId}"></textarea>
                    <button class="btn btn-primary comment-btn" data-match-id="${matchId}">أضف تعليق</button>
                </div>
            `;
            upcomingMatchesList.appendChild(matchItem);
        });

        // Add event listeners for match comments
        document.querySelectorAll(".comment-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const matchId = e.target.dataset.matchId;
                const commentInput = e.target.previousElementSibling;
                const comment = commentInput.value.trim();

                if (!comment) {
                    FCWolves.showNotification("الرجاء كتابة تعليق.", "error");
                    return;
                }

                try {
                    const newCommentRef = FCWolves.database.ref(`matches/${matchId}/comments`).push();
                    await newCommentRef.set({
                        author: loggedInUser.name,
                        comment: comment,
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    });
                    FCWolves.showNotification("تم إضافة التعليق بنجاح!");
                    commentInput.value = "";
                } catch (error) {
                    console.error("Error adding comment:", error);
                    FCWolves.showNotification("حدث خطأ أثناء إضافة التعليق.", "error");
                }
            });
        });
    });

    // Calendar 2025
    function generateCalendar(year) {
        const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        let calendarHTML = `<h3>تقويم ${year}</h3><div class="calendar-grid">`;

        for (let i = 0; i < 12; i++) {
            const date = new Date(year, i, 1);
            const firstDay = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
            const daysInMonth = new Date(year, i + 1, 0).getDate();

            calendarHTML += `<div class="month-card card">
                                <h4>${monthNames[i]}</h4>
                                <div class="days-grid">
                                    <span class="day-name">أحد</span>
                                    <span class="day-name">اثنين</span>
                                    <span class="day-name">ثلاثاء</span>
                                    <span class="day-name">أربعاء</span>
                                    <span class="day-name">خميس</span>
                                    <span class="day-name">جمعة</span>
                                    <span class="day-name">سبت</span>`;

            for (let j = 0; j < firstDay; j++) {
                calendarHTML += `<span class="empty-day"></span>`;
            }

            for (let day = 1; day <= daysInMonth; day++) {
                calendarHTML += `<span class="day-number">${day}</span>`;
            }
            calendarHTML += `</div></div>`;
        }
        calendarHTML += `</div>`;
        calendarContainer.innerHTML = calendarHTML;
    }

    generateCalendar(2025);

    // --- Posts Tab ---
    createPostBtn.addEventListener("click", async () => {
        const content = postContentInput.value.trim();
        if (!content) {
            FCWolves.showNotification("الرجاء كتابة محتوى المنشور.", "error");
            return;
        }

        try {
            const newPostRef = FCWolves.database.ref("posts").push();
            await newPostRef.set({
                authorId: loggedInUser.id,
                authorName: loggedInUser.name,
                content: content,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                likes: 0,
                comments: {}
            });
            FCWolves.showNotification("تم نشر المنشور بنجاح!");
            postContentInput.value = "";
        } catch (error) {
            console.error("Error creating post:", error);
            FCWolves.showNotification("حدث خطأ أثناء نشر المنشور.", "error");
        }
    });

    // Display posts
    FCWolves.database.ref("posts").on("value", (snapshot) => {
        postsFeed.innerHTML = "";
        snapshot.forEach((childSnapshot) => {
            const post = childSnapshot.val();
            const postId = childSnapshot.key;
            const postItem = document.createElement("div");
            postItem.className = "post-item card";
            postItem.innerHTML = `
                <div class="post-header">
                    <span class="post-author">${post.authorName}</span>
                    <span class="post-date">${FCWolves.formatDate(post.timestamp)}</span>
                </div>
                <p class="post-content">${post.content}</p>
                <div class="post-actions">
                    <button class="action-btn like-btn" data-id="${postId}" data-likes="${post.likes}">
                        <i class="fas fa-thumbs-up"></i> ${post.likes || 0}
                    </button>
                    <button class="action-btn comment-post-btn" data-id="${postId}">
                        <i class="fas fa-comment"></i> تعليق
                    </button>
                    ${post.authorId === loggedInUser.id ? `
                    <button class="action-btn edit-post-btn" data-id="${postId}">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="action-btn delete-post-btn" data-id="${postId}">
                        <i class="fas fa-trash"></i> حذف
                    </button>` : ``}
                </div>
                <div class="comments-section" id="comments-${postId}"></div>
            `;
            postsFeed.appendChild(postItem);

            // Display comments for each post
            const commentsSection = document.getElementById(`comments-${postId}`);
            if (post.comments) {
                Object.values(post.comments).forEach(comment => {
                    const commentElement = document.createElement("p");
                    commentElement.className = "comment-item";
                    commentElement.innerHTML = `<strong>${comment.author}:</strong> ${comment.comment}`;
                    commentsSection.appendChild(commentElement);
                });
            }
        });

        // Add event listeners for post actions
        document.querySelectorAll(".like-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const postId = e.currentTarget.dataset.id;
                const currentLikes = parseInt(e.currentTarget.dataset.likes) || 0;
                try {
                    await FCWolves.database.ref(`posts/${postId}/likes`).set(currentLikes + 1);
                } catch (error) {
                    console.error("Error liking post:", error);
                }
            });
        });

        document.querySelectorAll(".comment-post-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const postId = e.currentTarget.dataset.id;
                const commentText = prompt("اكتب تعليقك:");
                if (commentText) {
                    try {
                        await FCWolves.database.ref(`posts/${postId}/comments`).push({
                            author: loggedInUser.name,
                            comment: commentText,
                            timestamp: firebase.database.ServerValue.TIMESTAMP
                        });
                    } catch (error) {
                        console.error("Error adding comment:", error);
                    }
                }
            });
        });

        document.querySelectorAll(".edit-post-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const postId = e.currentTarget.dataset.id;
                const currentContent = e.currentTarget.closest(".post-item").querySelector(".post-content").textContent;
                const newContent = prompt("تعديل المنشور:", currentContent);
                if (newContent !== null && newContent.trim() !== "") {
                    try {
                        await FCWolves.database.ref(`posts/${postId}/content`).set(newContent);
                        FCWolves.showNotification("تم تعديل المنشور بنجاح!");
                    } catch (error) {
                        console.error("Error editing post:", error);
                        FCWolves.showNotification("حدث خطأ أثناء تعديل المنشور.", "error");
                    }
                }
            });
        });

        document.querySelectorAll(".delete-post-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const postId = e.currentTarget.dataset.id;
                if (confirm("هل أنت متأكد من حذف هذا المنشور؟")) {
                    try {
                        await FCWolves.database.ref(`posts/${postId}`).remove();
                        FCWolves.showNotification("تم حذف المنشور بنجاح!");
                    } catch (error) {
                        console.error("Error deleting post:", error);
                        FCWolves.showNotification("حدث خطأ أثناء حذف المنشور.", "error");
                    }
                }
            });
        });
    });

    // --- Chat Tab ---
    chatTabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            chatTabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            generalChatSection.classList.remove("active");
            privateChatSection.classList.remove("active");

            if (btn.dataset.chatType === "general") {
                generalChatSection.classList.add("active");
            } else {
                privateChatSection.classList.add("active");
            }
        });
    });

    // General Chat
    sendGeneralChatBtn.addEventListener("click", async () => {
        const message = generalChatMessageInput.value.trim();
        if (!message) return;

        try {
            await FCWolves.database.ref("generalChat").push({
                authorId: loggedInUser.id,
                authorName: loggedInUser.name,
                message: message,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            generalChatMessageInput.value = "";
            generalChatMessages.scrollTop = generalChatMessages.scrollHeight;
        } catch (error) {
            console.error("Error sending general chat message:", error);
            FCWolves.showNotification("حدث خطأ أثناء إرسال الرسالة.", "error");
        }
    });

    generalChatMessageInput.addEventListener("input", () => {
        FCWolves.database.ref(`players/${loggedInUser.id}/typing/general`).set(true);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            FCWolves.database.ref(`players/${loggedInUser.id}/typing/general`).set(false);
        }, 1500);
    });

    FCWolves.database.ref("generalChat").on("value", (snapshot) => {
        generalChatMessages.innerHTML = "";
        snapshot.forEach((childSnapshot) => {
            const msg = childSnapshot.val();
            const msgId = childSnapshot.key;
            const messageItem = document.createElement("div");
            messageItem.className = `message-item ${msg.authorId === loggedInUser.id ? 'sent' : 'received'}`;
            messageItem.innerHTML = `
                <div class="message-content">
                    <div class="message-author">${msg.authorName}</div>
                    ${msg.message}
                    <div class="message-time">${FCWolves.formatTime(msg.timestamp)}</div>
                    ${msg.authorId === loggedInUser.id ? `
                    <button class="action-btn edit-message-btn" data-id="${msgId}" data-chat-type="general">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-message-btn" data-id="${msgId}" data-chat-type="general">
                        <i class="fas fa-trash"></i>
                    </button>` : ``}
                </div>
            `;
            generalChatMessages.appendChild(messageItem);
        });
        generalChatMessages.scrollTop = generalChatMessages.scrollHeight;
    });

    // General Chat Typing Indicator
    FCWolves.database.ref("players").on("value", (snapshot) => {
        let typingUsers = [];
        snapshot.forEach((childSnapshot) => {
            const player = childSnapshot.val();
            if (player.id !== loggedInUser.id && player.typing && player.typing.general) {
                typingUsers.push(player.name);
            }
        });

        if (typingUsers.length > 0) {
            generalChatTypingIndicator.textContent = `${typingUsers.join(', ')} يكتبون الآن...`;
            generalChatTypingIndicator.classList.remove("hidden");
        } else {
            generalChatTypingIndicator.classList.add("hidden");
        }
    });

    // Private Chat
    privateChatSearchInput.addEventListener("input", () => {
        const searchTerm = privateChatSearchInput.value.toLowerCase();
        FCWolves.database.ref("players").once("value", (snapshot) => {
            privateChatUsersList.innerHTML = "";
            snapshot.forEach((childSnapshot) => {
                const player = childSnapshot.val();
                if (player.id !== loggedInUser.id && player.name.toLowerCase().includes(searchTerm)) {
                    const userItem = document.createElement("div");
                    userItem.className = "user-item";
                    userItem.dataset.id = player.id;
                    userItem.dataset.name = player.name;
                    userItem.innerHTML = `
                        <div class="user-avatar"></div>
                        <span class="user-name">${player.name}</span>
                    `;
                    privateChatUsersList.appendChild(userItem);
                }
            });

            document.querySelectorAll(".private-chat-users-list .user-item").forEach(item => {
                item.addEventListener("click", (e) => {
                    document.querySelectorAll(".private-chat-users-list .user-item").forEach(i => i.classList.remove("active"));
                    e.currentTarget.classList.add("active");
                    currentPrivateChatRecipient = {
                        id: e.currentTarget.dataset.id,
                        name: e.currentTarget.dataset.name
                    };
                    privateChatRecipientName.textContent = currentPrivateChatRecipient.name;
                    privateChatHeader.classList.remove("hidden");
                    privateChatInputArea.classList.remove("hidden");
                    loadPrivateMessages(loggedInUser.id, currentPrivateChatRecipient.id);
                });
            });
        });
    });

    async function loadPrivateMessages(senderId, receiverId) {
        privateChatMessages.innerHTML = "";
        const chatId = [senderId, receiverId].sort().join("_");
        FCWolves.database.ref(`privateChats/${chatId}`).on("value", (snapshot) => {
            privateChatMessages.innerHTML = "";
            snapshot.forEach((childSnapshot) => {
                const msg = childSnapshot.val();
                const msgId = childSnapshot.key;
                const messageItem = document.createElement("div");
                messageItem.className = `message-item ${msg.authorId === loggedInUser.id ? 'sent' : 'received'}`;
                messageItem.innerHTML = `
                    <div class="message-content">
                        <div class="message-author">${msg.authorName}</div>
                        ${msg.message}
                        <div class="message-time">${FCWolves.formatTime(msg.timestamp)}</div>
                        ${msg.authorId === loggedInUser.id ? `
                        <button class="action-btn edit-message-btn" data-id="${msgId}" data-chat-type="private" data-chat-id="${chatId}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-message-btn" data-id="${msgId}" data-chat-type="private" data-chat-id="${chatId}">
                            <i class="fas fa-trash"></i>
                        </button>` : ``}
                    </div>
                `;
                privateChatMessages.appendChild(messageItem);
            });
            privateChatMessages.scrollTop = privateChatMessages.scrollHeight;
        });
    }

    sendPrivateChatBtn.addEventListener("click", async () => {
        const message = privateChatMessageInput.value.trim();
        if (!message || !currentPrivateChatRecipient) return;

        const chatId = [loggedInUser.id, currentPrivateChatRecipient.id].sort().join("_");

        try {
            await FCWolves.database.ref(`privateChats/${chatId}`).push({
                authorId: loggedInUser.id,
                authorName: loggedInUser.name,
                message: message,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            privateChatMessageInput.value = "";
            privateChatMessages.scrollTop = privateChatMessages.scrollHeight;
        } catch (error) {
            console.error("Error sending private chat message:", error);
            FCWolves.showNotification("حدث خطأ أثناء إرسال الرسالة الخاصة.", "error");
        }
    });

    privateChatMessageInput.addEventListener("input", () => {
        if (currentPrivateChatRecipient) {
            FCWolves.database.ref(`players/${loggedInUser.id}/typing/private/${currentPrivateChatRecipient.id}`).set(true);
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                FCWolves.database.ref(`players/${loggedInUser.id}/typing/private/${currentPrivateChatRecipient.id}`).set(false);
            }, 1500);
        }
    });

    // Private Chat Typing Indicator
    FCWolves.database.ref("players").on("value", (snapshot) => {
        if (!currentPrivateChatRecipient) return;

        const recipientPlayer = snapshot.child(currentPrivateChatRecipient.id).val();
        if (recipientPlayer && recipientPlayer.typing && recipientPlayer.typing.private && recipientPlayer.typing.private[loggedInUser.id]) {
            privateChatTypingIndicator.textContent = `${currentPrivateChatRecipient.name} يكتب الآن...`;
            privateChatTypingIndicator.classList.remove("hidden");
        } else {
            privateChatTypingIndicator.classList.add("hidden");
        }
    });

    // Edit/Delete Message (General & Private)
    document.addEventListener("click", async (e) => {
        if (e.target.closest(".edit-message-btn")) {
            const btn = e.target.closest(".edit-message-btn");
            const msgId = btn.dataset.id;
            const chatType = btn.dataset.chatType;
            const chatId = btn.dataset.chatId; // Only for private chat
            const currentMessage = btn.closest(".message-content").childNodes[1].textContent.trim(); // Get message text
            const newMessage = prompt("تعديل الرسالة:", currentMessage);

            if (newMessage !== null && newMessage.trim() !== "") {
                try {
                    if (chatType === "general") {
                        await FCWolves.database.ref(`generalChat/${msgId}/message`).set(newMessage);
                    } else if (chatType === "private") {
                        await FCWolves.database.ref(`privateChats/${chatId}/${msgId}/message`).set(newMessage);
                    }
                    FCWolves.showNotification("تم تعديل الرسالة بنجاح!");
                } catch (error) {
                    console.error("Error editing message:", error);
                    FCWolves.showNotification("حدث خطأ أثناء تعديل الرسالة.", "error");
                }
            }
        }

        if (e.target.closest(".delete-message-btn")) {
            const btn = e.target.closest(".delete-message-btn");
            const msgId = btn.dataset.id;
            const chatType = btn.dataset.chatType;
            const chatId = btn.dataset.chatId; // Only for private chat

            if (confirm("هل أنت متأكد من حذف هذه الرسالة؟")) {
                try {
                    if (chatType === "general") {
                        await FCWolves.database.ref(`generalChat/${msgId}`).remove();
                    } else if (chatType === "private") {
                        await FCWolves.database.ref(`privateChats/${chatId}/${msgId}`).remove();
                    }
                    FCWolves.showNotification("تم حذف الرسالة بنجاح!");
                } catch (error) {
                    console.error("Error deleting message:", error);
                    FCWolves.showNotification("حدث خطأ أثناء حذف الرسالة.", "error");
                }
            }
        }
    });

    // --- Profile Tab ---
    profileName.textContent = loggedInUser.name;
    profileCode.textContent = `الرمز: ${loggedInUser.code}`;
    profilePosition.textContent = `المركز: ${loggedInUser.position}`;
    profileNumber.textContent = `الرقم: ${loggedInUser.number}`;

    // Set default avatar if no image is available
    profileAvatar.src = "images/default-avatar.png";

    // Load player data from Firebase to ensure it's up-to-date
    FCWolves.database.ref(`players/${loggedInUser.id}`).on("value", (snapshot) => {
        const player = snapshot.val();
        if (player) {
            profileName.textContent = player.name;
            profileCode.textContent = `الرمز: ${player.code}`;
            profilePosition.textContent = `المركز: ${player.position}`;
            profileNumber.textContent = `الرقم: ${player.number}`;
        }
    });
});

