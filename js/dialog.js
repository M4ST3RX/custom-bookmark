function dialog(title, placeholder = "Enter value") {
    return new Promise((resolve, reject) => {
        // Remove existing dialog if any
        const existingDialog = document.querySelector(".custom-modal");
        if (existingDialog) existingDialog.remove();

        // Create modal container
        const modal = document.createElement("div");
        modal.className = "custom-modal";
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${title}</h3>
                <input type="text" class="form-control" id="dialogInput" placeholder="${placeholder}">
                <div class="modal-actions">
                    <button id="dialogCancelBtn" class="btn btn-outline-secondary">Cancel</button>
                    <button id="dialogConfirmBtn" class="btn btn-primary">Confirm</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus input field
        const inputField = modal.querySelector("#dialogInput");
        inputField.focus();

        // Handle Confirm
        modal.querySelector("#dialogConfirmBtn").addEventListener("click", () => {
            resolve(inputField.value.trim());
            modal.remove();
        });

        // Handle Cancel
        modal.querySelector("#dialogCancelBtn").addEventListener("click", () => {
            reject("User cancelled input");
            modal.remove();
        });

        // Handle Enter key for submission
        inputField.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                resolve(inputField.value.trim());
                modal.remove();
            }
        });
    });
}