document.addEventListener("DOMContentLoaded", function() {
    // Get the container where instructions will appear
    const instructionListDiv = document.querySelector(".reports_list");
    const report_message_enter = document.querySelector(".report_message");
    const report_title = document.querySelector(".report_title");

    // Mock route data
    const mockRoute = ["testint1" , "testint2", "testdoor1", "testelvtr1", "testdoor2", "testint3", "testdoor3"];

    // Render instructions
    function renderInstructions(route) {

        // Clear any previous instructions
        instructionListDiv.innerHTML = "";
        let selectedReport = null;
        const steps = [];

        // Loop through each node in the route and create a step
        route.forEach((node, index) => {
            const stepDiv = document.createElement("div");
            stepDiv.textContent = `Report #${index + 1}`;
            stepDiv.classList.add("report_item"); // For easier CSS styling later

            stepDiv.addEventListener("click", () => {

                if (selectedReport && selectedReport !== stepDiv) {
                    selectedReport.classList.remove("selected");
                }

                report_message_enter.innerText = node;
                report_title.innerText = `Report #${index + 1}`;
                stepDiv.classList.add("selected");
                selectedReport = stepDiv;
            })

            instructionListDiv.appendChild(stepDiv);
            steps.push(stepDiv);
        });
        if (steps.length > 0) {
            steps[0].classList.add("selected");
            selectedReport = steps[0];
            report_message_enter.innerText = route[0];
            report_title.innerText = "Report #1"
        }
    }
    // Render the mock route
    renderInstructions(mockRoute);

// TODO: Replace mockRoute with actual route returned by backend


});