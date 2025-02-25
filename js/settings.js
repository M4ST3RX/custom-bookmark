document.addEventListener('DOMContentLoaded', function () {
    const themeSelect = document.getElementById("theme");
    const defaultTabSelect = document.getElementById("default-tab");

    // Load stored settings
    chrome.storage.local.get(["theme", "defaultTab"], function (result) {
        if (result.theme) themeSelect.value = result.theme;
        if (result.defaultTab) defaultTabSelect.value = result.defaultTab;
    });

    document.getElementById("save-settings").addEventListener("click", function () {
        chrome.storage.local.set({
            theme: themeSelect.value,
            defaultTab: defaultTabSelect.value
        }, function () {
            alert("Settings saved!");
            window.location.href = "popup.html"; // Return to main popup
        });
    });

    document.getElementById("back-to-popup").addEventListener("click", function () {
        window.location.href = "popup.html"; 
    });
});
