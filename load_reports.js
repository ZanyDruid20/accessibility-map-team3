let selectedReport = null;
let selectedId = null;

function renderInstructions(route) {

    const instructionListDiv = document.querySelector(".reports_list");
    const report_message_enter = document.querySelector(".report_message");
    const report_title = document.querySelector(".report_title");

    instructionListDiv.innerHTML = "";
    const steps = [];

    route.forEach((reportObj, index) => {

        const stepDiv = document.createElement("div");
        stepDiv.textContent = `Report #${reportObj.report_id}`;
        stepDiv.classList.add("report_item");

        stepDiv.addEventListener("click", () => {
            console.log(selectedId);
            if (selectedReport && selectedReport !== stepDiv) {
                selectedReport.classList.remove("selected");
            }
            report_message_enter.innerText = reportObj.content;
            report_title.innerText = `Report #${reportObj.report_id}`;
            stepDiv.classList.add("selected");
            selectedReport = stepDiv;
            selectedId = reportObj.report_id;
        });

        instructionListDiv.appendChild(stepDiv);
        steps.push(stepDiv);
    });

    if (steps.length > 0) {
        steps[0].classList.add("selected");
        selectedReport = steps[0];
        selectedId = route[0].report_id;
        report_message_enter.innerText = route[0].content;
        report_title.innerText = `Report #${route[0].report_id}`;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    
    let reportData = [];

    fetch("http://localhost:8000/reports", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to fetch reports");
        }
        return response.json();
    })
    .then(data => {
        reportData = data.reports;
        console.log(reportData);
        renderInstructions(reportData);

    });

});

const resolveBtn = document.getElementById("resolve_report_button");

resolveBtn.addEventListener("click", function () {
    const reportId = selectedId;

    fetch(`http://localhost:8000/reports/${reportId}/resolve`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    })

    fetch("http://localhost:8000/reports", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to fetch reports");
        }
        return response.json();
    })
    .then(data => {
        reportData = data.reports;
        renderInstructions(reportData);
    });
});