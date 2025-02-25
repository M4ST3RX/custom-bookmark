document.addEventListener('DOMContentLoaded', function () {
    const tabsContainer = document.getElementById("siteTabs");
    const siteList = document.getElementById("site-list");

    document.getElementById("open-add-site").addEventListener("click", function () {
        window.location.href = "add.html"; // Opens the add site page
    });

    document.getElementById("open-settings").addEventListener("click", function () {
        window.location.href = "settings.html"; 
    });

    chrome.storage.local.get("customTabs", function (result) {
        let customTabs = result.customTabs || [];
        customTabs.forEach(tabName => addNewTab(tabName));
    });

    document.querySelector(".add-tab").addEventListener("click", async () => {
        try {
            const tabName = await dialog("Enter tab name", "e.g., Development");
            if (!tabName) return;
    
            addNewTab(tabName);
        } catch (error) {
            console.log(error);
        }
    });

    function addNewTab(name) {
        const newTab = document.createElement("li");
        newTab.className = "nav-item";
        newTab.innerHTML = `
            <button class="nav-link" data-env="${name}">
                ${name} <span class="delete-tab text-danger ms-1">❌</span>
            </button>
        `;

        // Insert new tab before "+"
        document.querySelector(".add-tab").parentElement.before(newTab);

        // Handle tab switching
        newTab.querySelector(".nav-link").addEventListener("click", function (e) {
            if (e.target.classList.contains("delete-tab")) {
                removeTab(name, newTab);
            } else {
                setActiveTab(name);
            }
        });

        // Automatically select the newly created tab
        setActiveTab(name);
    }

    function removeTab(name, tabElement) {
        if (!confirm(`Remove tab "${name}"?`)) return;

        tabElement.remove();

        // Update storage
        chrome.storage.local.get("customTabs", function (result) {
            let customTabs = result.customTabs || [];
            customTabs = customTabs.filter(tab => tab !== name);
            chrome.storage.local.set({ "customTabs": customTabs });
        });

        // Reset content if no tabs exist
        if (document.querySelectorAll(".nav-item button:not(.add-tab)").length === 0) {
            siteList.innerHTML = "<p>Select or add a tab to start managing sites.</p>";
        }
    }

    function setActiveTab(name) {
        document.querySelectorAll(".nav-link").forEach(tab => tab.classList.remove("active"));
        const activeTab = document.querySelector(`[data-env="${name}"]`);
        if (activeTab) activeTab.classList.add("active");

        // Load sites for the selected tab
        loadSites(name);
    }

    function loadSites(env) {
        chrome.storage.local.get(["sites"], function (result) {
            let sites = result.sites || {};
            let siteListContent = sites[env] || [];

            siteList.innerHTML = ""; // Clear current list
            siteListContent.forEach(site => {
                let li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.innerHTML = `
                    ${site}
                    <button class="btn btn-sm btn-outline-danger delete-site">❌</button>
                `;

                // Handle Site Deletion
                li.querySelector(".delete-site").addEventListener("click", function () {
                    siteListContent = siteListContent.filter(s => s !== site);
                    sites[env] = siteListContent;
                    chrome.storage.local.set({ "sites": sites });
                    li.remove();
                });

                siteList.appendChild(li);
            });
        });
    }

    // Context Menu Logic
    let contextMenu = document.getElementById("context-menu");

    function initializeApp(data) {
        console.log(data);
        const siteList = document.getElementById("site-list");
        siteList.innerHTML = "";

        data.forEach(site => {
            const listItem = document.createElement("li");
            listItem.className = "list-group-item d-flex justify-content-between align-items-center";
            listItem.innerHTML = `
                <span>${site.name}</span>
                <button class="btn btn-light btn-sm context-menu-btn" data-url="${site.url}">⋮</button>
            `;
            
            listItem.querySelector(".context-menu-btn").addEventListener("click", function (event) {
                showContextMenu(event, site);
            });

            siteList.appendChild(listItem);
        });
    }

    function showContextMenu(event, site, env, index) {
        event.preventDefault();

        const popupWidth = 400; // Keep in sync with popup.html
        const menuWidth = 80; // Approximate menu width
        const menuHeight = 100; // Approximate menu height

        let x = event.clientX;
        let y = event.clientY;

        // Adjust position if the menu would go off-screen
        if (x + menuWidth > popupWidth) {
            x -= menuWidth; // Move left
        }
        if (y + menuHeight > window.innerHeight) {
            y -= menuHeight; // Move up
        }

        contextMenu.style.top = `${y}px`;
        contextMenu.style.left = `${x}px`;
        contextMenu.classList.add("active");

        // Set up menu actions
        contextMenu.querySelector(".open").onclick = () => window.open(site.url, '_blank');
        contextMenu.querySelector(".admin").onclick = () => window.open(`${site.url}/admin`, '_blank');
        contextMenu.querySelector(".delete").onclick = () => deleteSite(env, index);
    }

    // Close menu when clicking elsewhere
    document.addEventListener("click", () => {
        contextMenu.classList.remove("active");
    });

    function deleteSite(env, index) {
        fetch('bookmarks.json')
            .then(response => response.json())
            .then(data => {
                data[env].splice(index, 1);
                saveData(data);
                loadSites(data, env);
            });
    }

    function saveData(data) {
        chrome.storage.local.set({ "bookmarks": data });
    }

});
