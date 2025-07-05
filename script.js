let currentUser = localStorage.getItem("currentUser");
if (!currentUser) window.location.href = "login.html";

let notifications = [];

window.onload = () => {
  applyTheme();
  loadPosts();
  updateTrending();
};

function applyTheme() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
}

function createPost() {
  const caption = document.getElementById("caption").value;
  const file = document.getElementById("mediaUpload").files[0];

  if (!caption && !file) return;

  storeMedia(file, (mediaID, mediaType) => {
    const post = {
      id: Date.now(),
      user: currentUser,
      caption,
      mediaType,
      mediaID,
      likes: 0,
      comments: [],
      tags: extractTags(caption)
    };

    const posts = JSON.parse(localStorage.getItem("posts") || "[]");
    posts.unshift(post);
    localStorage.setItem("posts", JSON.stringify(posts));
    addNotification(`${currentUser} posted something new`);
    loadPosts();
    updateTrending();
  });
}

function loadPosts(filterTag = null) {
  const posts = JSON.parse(localStorage.getItem("posts") || "[]");
  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  posts.forEach(post => {
    if (filterTag && !post.tags.includes(filterTag)) return;

    const postDiv = document.createElement("div");
    postDiv.className = "post";

    loadMedia(post.mediaID, (mediaURL) => {
      if (mediaURL) {
        postDiv.innerHTML += post.mediaType === "video"
          ? `<video src="${mediaURL}" controls></video>`
          : `<img src="${mediaURL}" />`;
      }

      const tagsHTML = post.tags.map(tag => `<span onclick="loadPosts('${tag}')">#${tag}</span>`).join(" ");

      postDiv.innerHTML += `
        <p>${post.caption}</p>
        <small>By <b>${post.user}</b></small>
        <div>${tagsHTML}</div>
        <div class="actions">
          <button onclick="likePost(${post.id}, this)">❤️ Like (${post.likes})</button>
          <button onclick="commentPost(${post.id})">💬 Comment</button>
          ${post.user === currentUser ? `
            <button onclick="editPost(${post.id})">✏️ Edit</button>
            <button onclick="deletePost(${post.id})">🗑️ Delete</button>` : ""}
          ${post.user !== currentUser ? `<button onclick="followUser('${post.user}')">➕ Follow</button>` : ""}
        </div>
        <div class="comments" id="comments-${post.id}">
          ${post.comments.map(c => `<p>🗨️ ${c}</p>`).join("")}
        </div>
      `;

      feed.appendChild(postDiv);
      gsap.from(postDiv, { y: 30, opacity: 0, duration: 0.5 });
    });
  });
}

function likePost(id, btn) {
  const posts = JSON.parse(localStorage.getItem("posts") || "[]");
  const post = posts.find(p => p.id === id);
  post.likes += 1;
  btn.innerText = `❤️ Like (${post.likes})`;
  addNotification(`${currentUser} liked a post`);
  localStorage.setItem("posts", JSON.stringify(posts));
}

function commentPost(id) {
  const comment = prompt("Write a comment:");
  if (!comment) return;
  const posts = JSON.parse(localStorage.getItem("posts") || "[]");
  const post = posts.find(p => p.id === id);
  post.comments.push(`${currentUser}: ${comment}`);
  addNotification(`${currentUser} commented on a post`);
  localStorage.setItem("posts", JSON.stringify(posts));
  loadPosts();
}

function editPost(id) {
  const newText = prompt("Edit caption:");
  if (!newText) return;
  const posts = JSON.parse(localStorage.getItem("posts") || "[]");
  const post = posts.find(p => p.id === id);
  post.caption = newText;
  post.tags = extractTags(newText);
  localStorage.setItem("posts", JSON.stringify(posts));
  loadPosts();
}

function deletePost(id) {
  let posts = JSON.parse(localStorage.getItem("posts") || "[]");
  posts = posts.filter(p => p.id !== id);
  localStorage.setItem("posts", JSON.stringify(posts));
  loadPosts();
}

function extractTags(text) {
  return (text.match(/#\\w+/g) || []).map(t => t.replace("#", ""));
}

function updateTrending() {
  const posts = JSON.parse(localStorage.getItem("posts") || "[]");
  const tags = posts.flatMap(p => p.tags);
  const count = {};

  tags.forEach(t => count[t] = (count[t] || 0) + 1);

  const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const trend = document.getElementById("trending-tags");
  trend.innerHTML = top.map(([t]) => `<span onclick="loadPosts('${t}')">#${t}</span>`).join(" ");
}

function addNotification(msg) {
  notifications.push(msg);
  if (notifications.length > 5) notifications.shift();
}

function showNotifications() {
  const box = document.getElementById("notifications");
  box.style.display = box.style.display === "block" ? "none" : "block";
  box.innerHTML = notifications.length
    ? notifications.map(n => `<p>${n}</p>`).join("")
    : "<p>No new notifications</p>";
}

function followUser(userToFollow) {
  const followers = JSON.parse(localStorage.getItem("followers") || "{}");
  followers[userToFollow] = followers[userToFollow] || [];
  if (!followers[userToFollow].includes(currentUser)) {
    followers[userToFollow].push(currentUser);
  }
  localStorage.setItem("followers", JSON.stringify(followers));
  alert(`You followed ${userToFollow}`);
}

function searchPosts() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const posts = JSON.parse(localStorage.getItem("posts") || "[]");
  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  posts.filter(p => p.caption.toLowerCase().includes(query) || p.tags.some(t => t.toLowerCase().includes(query)))
    .forEach(post => {
      const postDiv = document.createElement("div");
      postDiv.className = "post";
      loadMedia(post.mediaID, (mediaURL) => {
        postDiv.innerHTML += post.mediaType === "video"
          ? `<video src="${mediaURL}" controls></video>`
          : `<img src="${mediaURL}" />`;
        postDiv.innerHTML += `
          <p>${post.caption}</p>
          <small>By <b>${post.user}</b></small>
        `;
        feed.appendChild(postDiv);
      });
    });
}
function logoutUser() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}