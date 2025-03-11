document.addEventListener('DOMContentLoaded', function () {
    const siteList = document.getElementById("site-list");

    document.getElementById("open-add-site").addEventListener("click", function () {
        window.location.href = "add.html"; // Opens the add site page
    });

    document.getElementById("open-settings").addEventListener("click", function () {
        window.location.href = "settings.html"; 
    });


    // Load custom tabs

    chrome.storage.local.get(["customTabs", "defaultTab"], function (result) {
        let customTabs = result.customTabs || [];
        let defaultTab = result.defaultTab;
        customTabs.forEach(tabName => addNewTab(tabName));

        if (defaultTab && customTabs.includes(defaultTab)) {
            setActiveTab(defaultTab);
        } else if (customTabs.length > 0) {
            setActiveTab(customTabs[0]);
        }
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

        chrome.storage.local.get("customTabs", function (result) {
            let customTabs = result.customTabs || [];
            if (!customTabs.includes(name)) {
                customTabs.push(name);
                chrome.storage.local.set({ "customTabs": customTabs });
            }
        });
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
        env = env.toLowerCase();
        chrome.storage.local.get("bookmarks", function (result) {
            let data = result.bookmarks || { local: [], staging: [], live: [] };
            let siteListContent = data[env] || [];
    
            siteList.innerHTML = ""; // Clear current list
    
            siteListContent.forEach((site, index) => {
                let li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.innerHTML = `
                    <span>${site.name}</span>
                    <button class="btn btn-light btn-sm context-menu-btn" data-url="${site.url}">⋮</button>
                `;
    
                // Attach context menu event
                li.querySelector(".context-menu-btn").addEventListener("click", function (event) {
                    showContextMenu(event, site, env, index);
                });
    
                siteList.appendChild(li);
            });
        });
    }

    // Context Menu Logic

    function showContextMenu(event, site, env, index) {
        event.preventDefault();

        let contextMenu = document.getElementById("context-menu");
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
        contextMenu.querySelector(".admin").onclick = () => {
            if (site.adminUrl) {
                window.open(site.url + site.adminUrl, '_blank');
            } else {
                alert("No Admin URL configured for this site.");
            }
        };
        contextMenu.querySelector(".delete").onclick = () => deleteSite(env, index);

        // Close menu when clicking elsewhere
        document.addEventListener("click", handleOutsideClick);


        function handleOutsideClick(e) {
            if (!contextMenu.contains(e.target) && !e.target.classList.contains("context-menu-btn")) {
                contextMenu.classList.remove("active");
                document.removeEventListener("click", handleOutsideClick);
            }
        }
    }

    // Drag and Drop Logic

    siteList.addEventListener("dragstart", (e) => {
        if (e.target.classList.contains("list-group-item")) {
            e.target.classList.add("dragging");
        }
    });

    siteList.addEventListener("dragend", (e) => {
        e.target.classList.remove("dragging");
    });

    siteList.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragging = document.querySelector(".dragging");
        const afterElement = getDragAfterElement(siteList, e.clientY);
        if (afterElement == null) {
            siteList.appendChild(dragging);
        } else {
            siteList.insertBefore(dragging, afterElement);
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll(".list-group-item:not(.dragging)")];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
});
