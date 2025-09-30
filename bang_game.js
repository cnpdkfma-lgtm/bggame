function startGame() {
  bangImg = images.bang_default;
  requestAnimationFrame(gameLoop);
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


/////////////////
function handleInput(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let clientX, clientY;

  if (e.type.startsWith("touch")) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const mx = (clientX - rect.left) * scaleX;
  const my = (clientY - rect.top) * scaleY;

  // 예시: 버튼 영역 처리
  if (mx >= 300 && mx <= 500 && my >= 600 && my <= 700) {
    startGame(); // 또는 requestAnimationFrame(window.gameLoop);
  }
}

// ✅ 이벤트 등록
canvas.addEventListener("click", handleInput);
canvas.addEventListener("touchstart", handleInput);
////////////////////

canvas.width = 850;
canvas.height = 1500;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let topRankings = [];

const dingPool = [];
const POOL_SIZE = 4;


const imageSources = {
  bang_default: "img/bang.png",
  bang_dental: "img/bang_dental.png",
  bang_n95: "img/bang_n95.png",
  bang_gown: "img/bang_gown.png",
  bang_needle: "img/bang_needle.png",
  pt1: "img/pt1.png",
  pt2: "img/pt2.png",
  pt3: "img/pt3.png",
  pt4: "img/pt4.png",
  background: "img/bg.jpg",
  startgame: "img/start.jpg",
  overgame: "img/over.jpg"
};

const images = {};
let imagesLoaded = 0;
const totalImages = Object.keys(imageSources).length;

for (const key in imageSources) {
  const img = new Image();
  img.src = imageSources[key];
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
      startGame();
    }
  };
  images[key] = img;
}

let bangImg;
let bang = { x: WIDTH / 2 - 100, y: HEIGHT - 415, width: 200, height: 170 };
let patients = [];
let score = 0;
let stage = 1;
let speed = 4;
let currentProtection = null;
let gameStarted = false;
let gameOver = false;
let passedPatients = 0;
let nameEntered = false;
let showHeart = false;
let heartTimer = 0;
let stageUpTimer = 0;
let stageUpHandled = false;


const protectionMap = {
  "덴탈마스크": ["백일해", "인플루엔자", "성홍열", "유행성 이하선염", "풍진"],
  "N95": ["결핵", "수두", "홍역", "파종성 대상포진"],
  "가운+장갑": ["CRE", "Candida auris", "MRSA", "옴", "C.difficile", "MRAB", "MRPA", "Rotavirus"],
  "안전바늘" : ["C형간염","B형간염","HIV"]
};

function drawTextWithBackground(text, x, y, font = "10px NanumGothic", textColor, bgColor) {
  ctx.font = font;
  ctx.textBaseline = "top";
  const padding = 5;

  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;

  // 폰트 크기 추출
  const fontSizeMatch = font.match(/\d+/);
  const textHeight = fontSizeMatch ? parseInt(fontSizeMatch[0], 10) : 10;

  // 배경 박스 그리기
  ctx.fillStyle = bgColor;
  ctx.fillRect(x - padding, y - padding, textWidth + padding * 2, textHeight + padding * 2);

  // 글자 그리기
  ctx.fillStyle = textColor;
  ctx.fillText(text, x, y);
}


//랭킹저장함수
function saveScoreToFirebase(playerName, department, score) {
  db.collection("rankings").add({
    name: playerName,
    department: department,
    score: score,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
}
//랭킹불러오기함수
function loadTopRankings(callback) {
  db.collection("rankings")
    .orderBy("score", "desc")
    .limit(5)
    .get()
    .then(snapshot => {
      const rankings = [];
      snapshot.forEach(doc => {
        rankings.push(doc.data());
      });
      callback(rankings);
    });
}


function setProtectionByClick(mx, my) {
  if (mx >= WIDTH / 2 - 360 && mx <= WIDTH / 2 - 360 + 159 && my >= HEIGHT - 240 && my <= HEIGHT - 240 + 234) {
    currentProtection = "덴탈마스크";
    bangImg = images.bang_dental;
  } else if (mx >= WIDTH / 2 - 170 && mx <= WIDTH / 2 - 170 + 150 && my >= HEIGHT - 240 && my <= HEIGHT - 240 + 234) {
    currentProtection = "N95";
    bangImg = images.bang_n95;
  } else if (mx >= WIDTH / 2 + 10 && mx <= WIDTH / 2 + 10 + 150 && my >= HEIGHT - 240 && my <= HEIGHT - 240 + 234) {
    currentProtection = "가운+장갑";
    bangImg = images.bang_gown;
  } else if (mx >= WIDTH / 2 + 190 && mx <= WIDTH / 2 + 190 + 140 && my >= HEIGHT - 240 && my <= HEIGHT - 240 + 234) {
    currentProtection = "안전바늘";
    bangImg = images.bang_needle;
  }
}


function createPatient(offset = 0) {
  let diseases = ["인플루엔자", "성홍열", "결핵", "수두", "옴", "MRSA", "CRE","HIV"];
  if (stage >= 3) {
    diseases = diseases.concat(["백일해", "유행성 이하선염", "홍역", "Candida auris","B형간염","C형간염"]);
  if (stage >= 5) {
    diseases = diseases.concat(["풍진", "파종성 대상포진", "C.difficile", "MRAB", "MRPA", "Rotavirus"]);
  }}

  const disease = diseases[Math.floor(Math.random() * diseases.length)];

  const patientImages = [images.pt1, images.pt2, images.pt3, images.pt4];
  const image = patientImages[Math.floor(Math.random() * patientImages.length)];

  const x = WIDTH / 2 - 70; 
  const y = -offset; 

  return { x, y, width: 165, height: 225, disease, image };
}

function resetGame() {
  bangImg = images.bang_default;
  currentProtection = null;
  gameOver = false;
  nameEntered = false;
  score = 0;
  stage = 1;
  passedPatients = 0;
  speed = 4;
  patients = [createPatient()];
}

function drawText(text, x, y, size = 40, color = "black") {
  ctx.fillStyle = color;
  ctx.font = `${size}px NanumGothic`;
  ctx.fillText(text, x, y);
}

function drawButton(text, x, y, width, height, color = "#0078FF") {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);

  ctx.save();

  ctx.fillStyle = "white";
  ctx.font = "40px NanumGothic";
  ctx.textAlign = "center";  
  ctx.textBaseline = "middle";

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  ctx.fillText(text, centerX, centerY);

  ctx.restore();
}

function drawButtonImage(image, x, y, width, height) {
  ctx.drawImage(image, x, y, width, height);
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  console.log("클릭 위치:", mx, my);

  if (!gameStarted) {
    if (mx >= WIDTH / 2 - 225 && mx <= WIDTH / 2 + 222 &&
        my >= HEIGHT / 2 + 390 && my <= HEIGHT / 2 + 550) {
      console.log("게임 시작 버튼 클릭됨");
      gameStarted = true;
      resetGame();
      requestAnimationFrame(gameLoop);
    }
  } else if (gameOver) {
    if (mx >= WIDTH / 2 - 189 && mx <= WIDTH / 2 + 200 &&
        my >= HEIGHT / 2 - 500 && my <= HEIGHT / 2 -387) {
      console.log("다시 시작 버튼 클릭됨");
      resetGame();
      requestAnimationFrame(gameLoop);
    }
  } else {
    // 게임 중일 때 보호구 버튼 클릭 처리
    setProtectionByClick(mx, my);
  }
});

function gameLoop() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  if (gameStarted && !gameOver) {
    ctx.drawImage(images.background, 0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = "#EBEBE9";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

    // 게임 시작 전 화면
  if (!gameStarted) {
    ctx.drawImage(images.startgame, 0, 0, WIDTH, HEIGHT);
    return;
  }

  // 게임 오버 화면
  if (gameOver) {
  ctx.drawImage(images.overgame, 0, 0, WIDTH, HEIGHT);

  const msg2 = `${score} 점`;
  ctx.font = "bold 45px NanumGothic";
  ctx.fillStyle = "#00003E";
  ctx.fillText(msg2, WIDTH / 2 - 56, HEIGHT / 2 - 115);

  if (!window.playerInfo && !document.getElementById("inputOverlay").style.display.includes("block")) {
    document.getElementById("inputOverlay").style.display = "block";
  }

  if (gameOver && !nameEntered && window.playerInfo) {
    const { playerName, department } = window.playerInfo;
    saveScoreToFirebase(playerName, department, score);
    nameEntered = true;

    loadTopRankings((savedRankings) => {
      savedRankings.forEach((entry, index) => {
        const line = `${entry.department}, ${entry.name}, ${entry.score}점`;
        ctx.font = "bold 35px NanumGothic";
        ctx.fillStyle = "#00003E";
        ctx.fillText(line, 200, HEIGHT / 2 + 110 + index * 102.8);
      });
    });
  }

  return;
}


    // 방글이 이미지 및 점수 표시
  ctx.drawImage(bangImg, bang.x, bang.y, bang.width, bang.height);
  if (showHeart) {
    drawText("♥", bang.x + 10, bang.y + 5, "bold 50px NanumGothic", "red");
    heartTimer--;

    if (heartTimer <= 0) {
      showHeart = false;
    }
  }

  drawTextWithBackground(`스테이지: ${stage}`, 10, 10, "35px NanumGothic", "white", "black");
  drawTextWithBackground(`점수: ${score}`, 10, 65, "35px NanumGothic", "yellow", "black");

if (stageUpTimer > 0) {
  let messageLines = ["Level UP!", "환자가 빨리 다가옵니다!"];

  if (stage === 3) {
    messageLines = ["Level UP!", "새로운 감염병 등장!"];
  } else if (stage === 5) {
    messageLines = ["Level UP!", "새로운 감염병 등장!"];
  } else if (stage === 7) {
    messageLines = [`스테이지 ${stage} 도달!`, "환자가 두명씩 등장!"];
  } 

  ctx.font = "bold 40px NanumGothic";
  ctx.textBaseline = "top";

  const centerY = HEIGHT / 2 - 100;
  const padding = 10;

  messageLines.forEach((line, i) => {
    const textWidth = ctx.measureText(line).width;
    const textHeight = 40; // 폰트 크기 기준
    const x = WIDTH / 2 - textWidth / 2;
    const y = centerY + i * 60;

    // 배경 박스
    ctx.fillStyle = i === 0 ? "black" : "black";
    ctx.fillRect(x - padding, y - padding, textWidth + padding * 2, textHeight + padding * 2);

    // 텍스트
    ctx.fillStyle = i === 0 ? "yellow" : "white";
    ctx.fillText(line, x, y);
  });

  stageUpTimer--;

  // 레벨업 메시지가 끝난 직후 환자 초기화
  if (stageUpTimer === 0 && !stageUpHandled) {
    patients = [];
    const maxPatients = stage < 7 ? 1 : 2;
    const fixedGap = 500;

    for (let i = 0; i < maxPatients; i++) {
      const offset = i * fixedGap;
      patients.push(createPatient(offset)); // y = -offset으로 위에서 등장
    }
    stageUpHandled = true;
  }

  requestAnimationFrame(gameLoop);
  return;
}
  
  // 환자 생성
  const maxPatients = stage < 7 ? 1 : 2;
  while (patients.length < maxPatients) {
    const fixedOffset = 400; // 속도와 무관한 고정 간격
    const offset = patients.length === 0 ? 0 : fixedOffset;

    patients.push(createPatient(offset));
  }

  // 환자 이동 및 충돌 처리
for (let i = patients.length - 1; i >= 0; i--) {
  const pt = patients[i];
  pt.y += speed;

  ctx.drawImage(pt.image, pt.x, pt.y, pt.width, pt.height);

  const text = pt.disease || "???"; // 혹시 disease가 undefined일 경우 대비
  ctx.font = "bold 35px NanumGothic";
  ctx.textBaseline = "top";
  ctx.fillStyle = "black";

  const textWidth = ctx.measureText(text).width || 0;
  const textX = pt.x + pt.width / 2 - textWidth / 2;
  const textY = pt.y - 30;

  const padding = 6;
  const textHeight = 35;

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillRect(textX - padding, textY - padding, textWidth + padding * 2, textHeight + padding * 2);

  ctx.fillStyle = "black";
  ctx.fillText(text, textX, textY);


  if (pt.y + pt.height >= bang.y) {
    const correct = protectionMap[currentProtection]?.includes(pt.disease);
    if (correct) {
      score += 10;
      passedPatients += 1;
      patients.splice(i, 1);

      showHeart = true;
      heartTimer = 15;
    } else {
      gameOver = true;
      bangImg = images.bang_over;
      patients.splice(i, 1);
    }
  }
}

  // 스테이지 증가
  if (passedPatients >= 10 && stage < 50) {
    stage += 1;
    passedPatients = 0;  
 
  if (stage < 7) {
    speed += 0.4; 
  } else {
    speed += 0.6;
    }
    stageUpTimer = 50;
    stageUpHandled = false;
  }

  
  requestAnimationFrame(gameLoop);
}

window.playerInfo = null;

window.handleStart = function() {
  const department = document.getElementById("departmentInput").value.trim();
  const name = document.getElementById("nameInput").value.trim();

  if (!department || !name) {
    alert("부서와 이름을 모두 입력해주세요.");
    return;
  }

  window.playerInfo = { department, playerName: name };

  document.getElementById("startScreen").style.display = "none";
  document.getElementById("gameCanvas").style.display = "block";

    requestAnimationFrame(gameLoop);

};
