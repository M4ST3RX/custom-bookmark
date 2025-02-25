document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("back-to-popup").addEventListener("click", function () {
        window.location.href = "popup.html"; // Go back to main popup
    });

    document.getElementById("save-site").addEventListener("click", function () {
        let name = document.getElementById("site-name").value.trim();
        let url = document.getElementById("site-url").value.trim();
        let env = document.getElementById("site-env").value;

        if (!name || !url) {
            alert("Please enter a valid site name and URL.");
            return;
        }

        chrome.storage.local.get("bookmarks", function (result) {
            let data = result.bookmarks || { local: [], staging: [], live: [] };
            data[env].push({ name, url });

            chrome.storage.local.set({ "bookmarks": data }, function () {
                window.location.href = "popup.html"; // Return to main popup after saving
            });
        });
    });
});
