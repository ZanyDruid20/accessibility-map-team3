// List of valid building names and alternate names
const buildings = {
    "admin": ["administration building", "admin", "admin building", "administration"],
    "biosci": ["biological sciences building", "bio sci", "biology", "biological sciences"],
    "commons": ["the commons", "commons building"],
    "eng": ["engineering building", "engineering"],
    "fine arts": ["fa", "fine arts building", "fine arts"],
    "ite": ["information and technology/engineering building", "it", "ite", "information and technology"],
    "ilsb": ["interdisciplinary life sciences building", "interdisciplinary life sciences", "ilsb", "life science", "life sciences"],
    //"lecture hall 1": ["lecture hall 1", "lh1", "lecture hall"],
    //"Lecture Hall 1": ["lecture hall 1","Lecture Hall 1","lec hall","lechall","lh1","lecturehall1","lecture hall","lecturehall 1"],
    //"lechall": ["lecture hall 1", "lh1", "lecturehall1", "lec hall", "lec hall 1", "lecturehall1"],
    "Lecture Hall 1": ["lecture hall 1","Lecture Hall 1","lec hall","lh1"],
    "aoklib": ["library & gallery, albin o. kuhn", "library", "aok", "aok library"],
    //"mathpsych": ["math and psychology building", "math and psychology", "mathpsych", "math psych", "math&psych"],
    "MathandPsych": ["math and psychology building", "math and psychology", "math and psych", "mathpsych", "math psych", "math&psych"],
    "meyer": ["meyerhoff chemistry building", "meyerhoff", "chemistry"],
    "pahb": ["performing arts and humanities building", "performing arts", "humanities", "pahb"],
    "physics": ["physics building", "physics"],
    "pubpol": ["public policy building", "public policy", "pb"],
    "rac": ["retriever activities center", "rac", "gym"],
    "sondheim": ["sondheim hall", "sondheim"],
    "cwb": ["the center for well-being", "center for well-being", "rih", "wellbeing center"],
    "dhall": ["true grit’s", "dining hall", "true grits"],
    "uc": ["university center", "uc", "starbucks", "chick fil a"]
};

function normalize(input) {
    return input.toLowerCase().replace(/\s/g, "");
}

function getCanonicalBuildingName(input) {
    const normInput = normalize(input);
    for (const [mainName, aliases] of Object.entries(buildings)) {
        if (normalize(mainName) === normInput) return mainName;
        if (aliases.some(alias => normalize(alias) === normInput)) return mainName;
    }
    return null;
}

function cleanUpMap() {
  const nodes = document.querySelectorAll("#map-wrapper .circle, #map-wrapper .circle_three, #map-wrapper .curved_paths");
  nodes.forEach(node => {
    node.style.visibility = "hidden";
  })
}

document.addEventListener("DOMContentLoaded", function() {
    const form = document.querySelector("form");
    const startInput = document.getElementById("start_dest");
    const endInput = document.getElementById("end_destination");
    const startFloorInput = document.getElementById("start_floor");
    const endFloorInput = document.getElementById("end_floor");


    form.addEventListener("submit", function(event) {
        event.preventDefault();

        cleanUpMap();

        const start = startInput.value.trim();
        const end = endInput.value.trim();
        const startCanonical = getCanonicalBuildingName(start);
        const endCanonical = getCanonicalBuildingName(end);
        let errors = [];

        if (!start) errors.push("Starting location is required.");
        else if (!startCanonical) errors.push(`"${start}" is not a valid building.`);

        if (!end) errors.push("Ending location is required.");
        else if (!endCanonical) errors.push(`"${end}" is not a valid building.`);

        if (startCanonical && endCanonical && startCanonical === endCanonical) {
            errors.push("Starting and ending locations cannot be the same building.");
        }
        
        const validFloors = ["1","2","3","4","5","6","7","M","L","G","B"];
        const startFloor = startFloorInput.value.trim().toUpperCase();
        const endFloor = endFloorInput.value.trim().toUpperCase();

        if (!startFloor) errors.push("Starting floor is required.");
        else if (!validFloors.includes(startFloor)) errors.push(`"${startFloor}" is not a valid floor.`);

        if (!endFloor) errors.push("Ending floor is required.");
        else if (!validFloors.includes(endFloor)) errors.push(`"${endFloor}" is not a valid floor.`);

        if (errors.length > 0) {
            alert(errors.join("\n"));
            return false;
        }
        
        window.startCanonical = startCanonical;
        window.endCanonical = endCanonical;

        window.startFloor = startFloor;
        window.endFloor = endFloor;

        if (typeof loadRouteInstructions === "function") {
            loadRouteInstructions();
        }

        const url = `https://accessibility-map-team3-production.up.railway.app/shortest-path?start_building=${encodeURIComponent(startCanonical)}&start_floor=${encodeURIComponent(startFloor)}&end_building=${encodeURIComponent(endCanonical)}&end_floor=${encodeURIComponent(endFloor)}`;

        fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            showPath(data.path)
          })
          .catch(error => {
            console.error("Fetch error:", error);
            alert("No routes available.")
          });

        });
});

const container = document.getElementById('map-container');
const wrapper = document.getElementById('map-wrapper');

function normalizeId(id) {
    if (id.includes("-")) {
        return id.slice(0, -2);
    }
    return id;
}

function showPath(flag_array) {

    let svg = document.getElementById("path-lines");
    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("id", "path-lines");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.pointerEvents = "none";
        document.body.appendChild(svg);
    }

    svg.innerHTML = "";

    for (let i = 0; i < flag_array.length - 1; i++) {
        flag_array[i] = normalizeId(flag_array[i]);
        flag_array[i+1] = normalizeId(flag_array[i+1]);
        const startFlag = document.getElementById(flag_array[i]);
        const endFlag = document.getElementById(flag_array[i + 1]);
        if ((flag_array[i] == "purpleint_7" && flag_array[i + 1] == "aoklib_d2") || (flag_array[i] == "aoklib_d2" && flag_array[i + 1] == "purpleint_7")){

          const curvedPath = document.getElementById("curved_path1");
          curvedPath.style.visibility = "visible";
        } else if ((flag_array[i] == "greenint_2" && flag_array[i + 1] == "greenint_3") || (flag_array[i] == "greenint_3" && flag_array[i + 1] == "greenint_2")){

          const curvedPath = document.getElementById("curved_path2");
          curvedPath.style.visibility = "visible";
        } else if ((flag_array[i] == "purpleint_2" && flag_array[i + 1] == "purpleint_1") || (flag_array[i] == "purpleint_1" && flag_array[i + 1] == "purpleint_2")){

          const curvedPath = document.getElementById("curved_path3");
          curvedPath.style.visibility = "visible";
        } else if ((flag_array[i] == "pinkint_10" && flag_array[i + 1] == "pinkint_9") || (flag_array[i] == "pinkint_9" && flag_array[i + 1] == "pinkint_10")){

          const curvedPath = document.getElementById("curved_path4");
          curvedPath.style.visibility = "visible";
        } else if ((flag_array[i] == "pinkint_5" && flag_array[i + 1] == "pinkint_9") || (flag_array[i] == "pinkint_9" && flag_array[i + 1] == "pinkint_5")){

          const curvedPath = document.getElementById("curved_path5");
          curvedPath.style.visibility = "visible";
        } else if ((flag_array[i] == "pinkint_12" && flag_array[i + 1] == "pinkint_9") || (flag_array[i] == "pinkint_9" && flag_array[i + 1] == "pinkint_12")){

          const curvedPath = document.getElementById("curved_path6");
          curvedPath.style.visibility = "visible";
        } else {
          if (!startFlag || !endFlag) continue;

          const startX = parseFloat(startFlag.style.left);
          const startY = parseFloat(startFlag.style.top);
          const endX = parseFloat(endFlag.style.left);
          const endY = parseFloat(endFlag.style.top);

          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", startX + startFlag.offsetWidth / 2);
          line.setAttribute("y1", startY + startFlag.offsetHeight / 2);
          line.setAttribute("x2", endX + endFlag.offsetWidth / 2);
          line.setAttribute("y2", endY + endFlag.offsetHeight / 2);
          line.setAttribute("stroke", "#5294ff");
          line.setAttribute("stroke-width", "4");

          svg.appendChild(line);
          addArrowsAlongLine(svg,
            startX + startFlag.offsetWidth / 2,
            startY + startFlag.offsetHeight / 2,
            endX + endFlag.offsetWidth / 2,
            endY + endFlag.offsetHeight / 2
          );

          if ((flag_array[i].includes("_d")) || (flag_array[i].includes("_e"))) {
            startFlag.style.visibility = "visible";
          }
          if ((flag_array[i+1].includes("_d")) || (flag_array[i+1].includes("_e"))) {
            endFlag.style.visibility = "visible";
          }
        }
    }
    wrapper.appendChild(svg);
}

function addArrowsAlongLine(svg, x1, y1, x2, y2) {
    const ARROW_SPACING = 40;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const steps = Math.floor(length / ARROW_SPACING);

    for (let i = 1; i < steps; i++) {
        const px = x1 + (dx * (i / steps));
        const py = y1 + (dy * (i / steps));

        const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        arrow.setAttribute("points", "0,-6 12,0 0,6");
        arrow.setAttribute("fill", "#5294ff");
        arrow.setAttribute("transform", `translate(${px},${py}) rotate(${angle})`);

        svg.appendChild(arrow);
    }
}

let scale = 1;
let posX = 0, posY = 0;
let isPanning = false;
let startX, startY;
let currentPopUp = '';
let popUpStatus = '';

let lastTouchDistance = null;

container.addEventListener("dragstart", e => e.preventDefault());

container.addEventListener('mousedown', e => {
  isPanning = true;
  startX = e.clientX - posX;
  startY = e.clientY - posY;
  container.style.cursor = 'grabbing';
});

window.addEventListener('mouseup', () => {
  isPanning = false;
  container.style.cursor = 'grab';
});

container.addEventListener('mouseleave', () => {
  isPanning = false;
  container.style.cursor = 'grab';
});

container.addEventListener('mousemove', e => {
  e.preventDefault();
  if (!isPanning) return;
  posX = e.clientX - startX;
  posY = e.clientY - startY;
  updateTransform();
});

container.addEventListener('wheel', e => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const delta = e.deltaY < 0 ? 1 : -1;
    scale += delta * zoomIntensity;
    scale = Math.min(Math.max(0.5, scale), 3);
    updateTransform();
});

function updateTransform() {
  wrapper.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
}

// Dragging with one finger
container.addEventListener("touchstart", e => {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    isPanning = true;
    startX = touch.clientX - posX;
    startY = touch.clientY - posY;
  }

  // Pinch zoom start
  if (e.touches.length === 2) {
    lastTouchDistance = getTouchDistance(e.touches);
  }
});

container.addEventListener("touchmove", e => {
  e.preventDefault();

  // Single finger drag
  if (e.touches.length === 1 && isPanning) {
    const touch = e.touches[0];
    posX = touch.clientX - startX;
    posY = touch.clientY - startY;
    updateTransform();
  }

  // Two finger pinch zoom
  if (e.touches.length === 2) {
    const newDistance = getTouchDistance(e.touches);
    if (lastTouchDistance !== null) {
      const delta = newDistance - lastTouchDistance;
      scale += delta * 0.002; // adjust zoom sensitivity
      scale = Math.min(Math.max(0.5, scale), 3);
      updateTransform();
    }
    lastTouchDistance = newDistance;
  }
});

container.addEventListener("touchend", e => {
  if (e.touches.length < 2) {
    lastTouchDistance = null;
  }
  if (e.touches.length === 0) {
    isPanning = false;
  }
});

/* ------------------------------
   UTILS
--------------------------------*/

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function showPopUp(bubble) {
  if (currentPopUp == bubble){
    TurnPopUpOff(bubble);
    return;
  }else if(bubble == 'map' && currentPopUp != ''){

    TurnPopUpOff(currentPopUp);
    return;
  }else if(bubble == 'map' && currentPopUp == ''){
    return;
  }else if(currentPopUp == ''){
    const getBubble = document.getElementById(bubble);
    getBubble.style.visibility = 'visible';
    currentPopUp = bubble;
    popUpStatus = "building";

  }else{
    TurnPopUpOff(currentPopUp);
    const getBubble = document.getElementById(bubble);
    getBubble.style.visibility = 'visible';
    currentPopUp = bubble;
    popUpStatus = "building";

  }
}

function TurnPopUpOff(bubble) {
  if (popUpStatus == 'building'){
    const getBubble = document.getElementById(bubble);
    getBubble.style.visibility = 'hidden';
    currentPopUp = '';
    popUpStatus = '';
  }else{
    const deleteDiv = document.getElementById('node_info');
    deleteDiv.remove();
    currentPopUp = '';
    popUpStatus = '';
  }
}

function createNodeBubble(x, y, name) {
  if (currentPopUp == '' && popUpStatus == '' && name != 'map'){
    let newDiv = document.createElement('div');
    newDiv.id = 'node_info'
    newDiv.innerText = name;
    newDiv.classList.add("node_info");
    let newX = (x - 45) + "px";
    let newY = (y - 30) + "px";

    newDiv.style.top = newY;
    newDiv.style.left = newX;
    wrapper.appendChild(newDiv);
    currentPopUp = name;
    popUpStatus = "node";
  }else if(name == 'map' && currentPopUp != ''){
    TurnPopUpOff(currentPopUp);
    return;
  }else if(name == 'map' && currentPopUp == ''){
    return;
  }else if(currentPopUp == name){
    TurnPopUpOff(name);
    return;
  }else{
    TurnPopUpOff(currentPopUp);
    let newDiv = document.createElement('div');
    newDiv.id = 'node_info'
    newDiv.innerText = name;
    newDiv.classList.add("node_info");
    let newX = (x - 40) + "px";
    let newY = (y - 30) + "px";

    newDiv.style.top = newY;
    newDiv.style.left = newX;
    wrapper.appendChild(newDiv);
    currentPopUp = name;
    popUpStatus = "node";
  }
}

async function requestLocationOnce() {
  if (!('permissions' in navigator) || !('geolocation' in navigator)) {
    console.error('Geolocation not supported');
    return;
  }

  const status = await navigator.permissions.query({ name: 'geolocation' });

  if (status.state === 'granted') {
    console.log('Permission already granted!');
    startRepeatingLocation(); // call your existing getLocation() here
  } else if (status.state === 'prompt') {
    console.log('Asking for permission...');
    //getLocation(); // this will trigger the prompt once
    startRepeatingLocation();
  } else {
    console.warn('Permission denied.');
  }

  // Listen for permission changes
  status.onchange = () => console.log('Permission state changed:', status.state);
}

//METHOD 1 (Updates only when detected movement)


var watchId = null;

function startWatchingLocation() {
  if ('geolocation' in navigator) {
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        console.log('Location:', latitude, longitude, 'accuracy (m):', accuracy);
      },
      (err) => {
        console.error('Geolocation error', err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  } else {
    console.error('Geolocation not supported');
  }
}

function stopWatchingLocation() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    console.log('Stopped watching location');
    watchId = null;
  }
}

function turnOnUIPopUp(name){

    const uiBox = document.getElementById(name);
    const dark_box = document.getElementById('aboutUsDarkScreen');
    if (uiBox.style.display == 'none'){
        uiBox.style.display = 'block';
        dark_box.style.display = 'flex';
    }else{
        uiBox.style.display = 'none';
        dark_box.style.display = 'none';
    }

}

function turnOnUIReportPopUp(name){

    const uiBox = document.getElementById(name);
    const reportBox = document.getElementById('reportOptionsUI');
    if (uiBox.style.display == 'none'){
        uiBox.style.display = 'block';
        reportBox.style.display = 'none';
    }else{
        reportBox.style.display = 'block';
        uiBox.style.display = 'none';
    }
}

function turnOffUIPopUp(name) {
    const uiBox = document.getElementById(name);
    const dark_box = document.getElementById('aboutUsDarkScreen');

    uiBox.style.display = 'none';
    dark_box.style.display = 'none';
}


const dark_screen = document.querySelector('.dark_screen');

dark_screen.addEventListener('click', function (e) {
  if (e.target === this) {
    const childElements = this.children;
    for (const child of childElements){
        child.style.display = 'none';
        this.style.display = 'none';
    }
  }
});

const reportBtn = document.querySelector(".report_button_ui_route");

if (reportBtn) {
    reportBtn.addEventListener('mouseenter', () => {
        const msg = document.querySelector("#regular_message");
        if (msg) {
            msg.innerText = 'Report an unavailable pathway/door/node/elevator';
        }
    });
}

const routeBtn = document.querySelector(".report_button_ui_route");
if (routeBtn) {
    routeBtn.addEventListener('mouseleave', () => {
        const msg = document.querySelector("#regular_message");
        if (msg) {
            msg.innerText = 'A route report or a website bug/error report?';
        }
    });
}

const websiteBtn = document.querySelector(".report_button_ui_website");
if (websiteBtn) {
    websiteBtn.addEventListener('mouseenter', () => {
        const msg = document.querySelector("#regular_message");
        if (msg) {
            msg.innerText = 'Report an error with the website itself';
        }
    });

    websiteBtn.addEventListener('mouseleave', () => {
        const msg = document.querySelector("#regular_message");
        if (msg) {
            msg.innerText = 'A route report or a website bug/error report?';
        }
    });
}

const report_website_form = document.querySelector('.report_website_form');

if (report_website_form) {
    report_website_form.addEventListener('submit', (event) => {
        event.preventDefault();

    const message = document.querySelector('#myInput').value;

    fetch("https://accessibility-map-team3-production.up.railway.app/report?report=" + encodeURIComponent(message), {
      method: "POST"
    })

    document.querySelector('#myInput').value = "";

  })
};

function includeHTML() {
  var z, i, elmnt, file, xhttp;
  z = document.getElementsByTagName("*");
  for (i = 0; i < z.length; i++) {
    elmnt = z[i];
    file = elmnt.getAttribute("w3-include-html");
    if (file) {
      xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {elmnt.innerHTML = this.responseText;}
          if (this.status == 404) {elmnt.innerHTML = "Page not found.";}
          elmnt.removeAttribute("w3-include-html");
          includeHTML();
        }
      }      
      xhttp.open("GET", file, true);
      xhttp.send();
      return;
    }
  }
};

let isPanningTwo = false;
let startXTwo = 0;
let startYTwo = 0;
let posXTwo = 0;
let posYTwo = 0;
let scaleTwo = 1;

let lastTouchDistanceTwo = null;

const containerTwo = document.getElementById('popup-map-container');
const wrapperTwo = document.getElementById('popup-map-wrapper');

if (containerTwo) {

    containerTwo.addEventListener("dragstart", e => e.preventDefault());

    containerTwo.addEventListener('mousedown', e => {
        isPanningTwo = true;
        startXTwo = e.clientX - posXTwo;
        startYTwo = e.clientY - posYTwo;
        containerTwo.style.cursor = 'grabbing';
    });

    containerTwo.addEventListener('mouseup', () => {
        isPanningTwo = false;
        containerTwo.style.cursor = 'grab';
    });

    containerTwo.addEventListener('mouseleave', () => {
        isPanningTwo = false;
        containerTwo.style.cursor = 'grab';
    });

    containerTwo.addEventListener('mousemove', e => {
        if (!isPanningTwo) return;
        posXTwo = e.clientX - startXTwo;
        posYTwo = e.clientY - startYTwo;
        updateTransformTwo();
    });

    containerTwo.addEventListener('wheel', e => {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const delta = e.deltaY < 0 ? 1 : -1;
        scaleTwo += delta * zoomIntensity;
        scaleTwo = Math.min(Math.max(0.5, scaleTwo), 3);
        updateTransformTwo();
    });
    
    /* --------------------------------------
       MOBILE TOUCH DRAG + PINCH ZOOM
    -------------------------------------- */

    containerTwo.addEventListener("touchstart", e => {
        if (e.touches.length === 1) {
            const t = e.touches[0];
            isPanningTwo = true;
            startXTwo = t.clientX - posXTwo;
            startYTwo = t.clientY - posYTwo;
        }

        if (e.touches.length === 2) {
            lastTouchDistanceTwo = getTouchDistanceTwo(e.touches);
        }
    });

    containerTwo.addEventListener("touchmove", e => {
        e.preventDefault();

        // One-finger drag
        if (e.touches.length === 1 && isPanningTwo) {
            const t = e.touches[0];
            posXTwo = t.clientX - startXTwo;
            posYTwo = t.clientY - startYTwo;
            updateTransformTwo();
        }

        // Two-finger pinch zoom
        if (e.touches.length === 2) {
            const newDist = getTouchDistanceTwo(e.touches);
            if (lastTouchDistanceTwo !== null) {
                const delta = newDist - lastTouchDistanceTwo;
                scaleTwo += delta * 0.002; 
                scaleTwo = Math.min(Math.max(0.5, scaleTwo), 3);
                updateTransformTwo();
            }
            lastTouchDistanceTwo = newDist;
        }
    });

    containerTwo.addEventListener("touchend", e => {
        if (e.touches.length < 2) lastTouchDistanceTwo = null;
        if (e.touches.length === 0) isPanningTwo = false;
    });
}

/* --------------------------------------
   Utility for pinch distance
-------------------------------------- */
function getTouchDistanceTwo(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function updateTransformTwo() {
  wrapperTwo.style.transform =
    `translate(${posXTwo}px, ${posYTwo}px) scale(${scaleTwo})`;
}

function sendNodeReport(name, nodeName) {

    const uiBox = document.getElementById(name);
    const secondDarkScreen = document.getElementById("another_dark_screen");
    const reportButton = document.getElementById("reportNodeButton");

    if (uiBox.style.display == 'none'){
        uiBox.style.display = 'block';
        secondDarkScreen.style.display = 'flex';

    }else{
        uiBox.style.display = 'none';
        secondDarkScreen.style.display = 'none';
        return;
    }

    reportButton.dataset.nodeName = nodeName;

    reportButton.onclick = () => {
        const id = reportButton.dataset.nodeName;
        uiBox.style.display = 'none';
        secondDarkScreen.style.display = 'none';
        fetch(`https://accessibility-map-team3-production.up.railway.app/main/update_threshold?node_id=${encodeURIComponent(id)}`, {
            method: "PUT"
        })
    };

}

function closeNodeReport() {

    const uiBox = document.getElementById("reportNodeOptions");
    const secondDarkScreen = document.getElementById("another_dark_screen");
    uiBox.style.display = 'none';
    secondDarkScreen.style.display = 'none';

}

// admin.html js
function createNodeBubble2(x, y, nodeId) {

    window.currentNodeId = nodeId;

    const title = document.getElementById("nodeTitle");
    title.textContent = "Node ID: " + nodeId;

    const nodeEl = document.getElementById(nodeId);
    const isOff = nodeEl.classList.contains("node-off");

    const toggleBtn = document.getElementById("toggleNodeBtn");
    toggleBtn.textContent = isOff ? "Turn ON Node" : "Turn OFF Node";
    toggleBtn.classList.remove("on-state", "off-state");

    toggleBtn.classList.add(isOff ? "on-state" : "off-state");

    toggleBtn.onclick = function () {
        toggleNode(nodeId);
    };

    turnOnUIPopUp("nodeUI");
}

function toggleNode(nodeId) {
    const nodeEl = document.getElementById(nodeId);
    const isOff = nodeEl.classList.contains("node-off");

    fetch(`https://accessibility-map-team3-production.up.railway.app/nodes/toggle?node=${nodeId}`, {
        method: "POST"
    })
    .then(res => res.json())
    .then(data => {
        console.log("Backend updated:", data);

        if (isOff) {
            nodeEl.classList.remove("node-off");
        } else {
            nodeEl.classList.add("node-off");
        }
    })
    .catch(err => {
        console.error("Error updating node:", err);
    });

    turnOffUIPopUp("nodeUI");
}

function loadOffNodes() {
fetch("https://accessibility-map-team3-production.up.railway.app/nodes/off")
  .then(res => res.json())
  .then(data => {
    console.log("OFF nodes from backend:", data.off_nodes);

    const offNodes = data.off_nodes;

    offNodes.forEach(nodeId => {
      const el = document.getElementById(nodeId);
      if (el) {
        el.classList.add("node-off");
      }
    });

  })
  .catch(err => {
    console.error("Failed to load off nodes:", err);
  });
};

window.onload = function () {
    loadOffNodes();
};

let collapsed = false;

document.querySelector('.collapse_left_arrow').addEventListener('click', () => {
  const mainMap = document.getElementById("center_stuff");
  const instructions = document.getElementById("instruction_sidebar");
  const directory = document.getElementById("directory_sidebar");
  const bigMap = document.getElementById("big_map");
  const leftArrow = document.getElementById("left_collapse_arrow");
  const rightArrow = document.getElementById("right_collapse_arrow");
  const leftArrowDiv = document.getElementById("left_arrow_div");
  const rightArrowDiv = document.getElementById("right_arrow_div");
  if (collapsed == false){
    mainMap.classList.remove("center_line");
    mainMap.classList.add("collapsed_center_line");
    instructions.style.display = "none";
    directory.style.display = "none";
    bigMap.style.width = "60%";
    leftArrow.src = "https://cdn-icons-png.flaticon.com/512/109/109617.png";
    rightArrow.src = "https://cdn-icons-png.flaticon.com/512/109/109618.png";
    leftArrowDiv.style.left = 5;
    rightArrowDiv.style.right = 5;
    collapsed = true;
  } else {
    mainMap.classList.remove("collapsed_center_line");
    mainMap.classList.add("center_line");
    instructions.style.display = "block";
    directory.style.display = "block";
    bigMap.style.width = "40%";
    rightArrow.src = "https://cdn-icons-png.flaticon.com/512/109/109617.png";
    leftArrow.src = "https://cdn-icons-png.flaticon.com/512/109/109618.png";
    leftArrowDiv.style.left = "20%";
    rightArrowDiv.style.right = "20%";
    collapsed = false;
  }

});

document.querySelector('.collapse_right_arrow').addEventListener('click', () => {
  const mainMap = document.getElementById("center_stuff");
  const instructions = document.getElementById("instruction_sidebar");
  const directory = document.getElementById("directory_sidebar");
  const bigMap = document.getElementById("big_map");
  const leftArrow = document.getElementById("left_collapse_arrow");
  const rightArrow = document.getElementById("right_collapse_arrow");
  const leftArrowDiv = document.getElementById("left_arrow_div");
  const rightArrowDiv = document.getElementById("right_arrow_div");
  if (collapsed == false){
    mainMap.classList.remove("center_line");
    mainMap.classList.add("collapsed_center_line");
    instructions.style.display = "none";
    directory.style.display = "none";
    bigMap.style.width = "60%";
    leftArrow.src = "https://cdn-icons-png.flaticon.com/512/109/109617.png";
    rightArrow.src = "https://cdn-icons-png.flaticon.com/512/109/109618.png";
    leftArrowDiv.style.left = 5;
    rightArrowDiv.style.right = 5;
    collapsed = true;
  } else {
    mainMap.classList.remove("collapsed_center_line");
    mainMap.classList.add("center_line");
    instructions.style.display = "block";
    directory.style.display = "block";
    bigMap.style.width = "40%";
    rightArrow.src = "https://cdn-icons-png.flaticon.com/512/109/109617.png";
    leftArrow.src = "https://cdn-icons-png.flaticon.com/512/109/109618.png";
    leftArrowDiv.style.left = "20%";
    rightArrowDiv.style.right = "20%";
    collapsed = false;
  }
});
