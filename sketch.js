let capture;
let bodyPose;
let handPose;
let poses = [];
let hands = [];
let earringImages = [];
let currentEarringIndex = 0; // 預設顯示第一款

function preload() {
  // 預載五款耳環圖片
  earringImages[0] = loadImage('pic/acc/acc1_ring.png');
  earringImages[1] = loadImage('pic/acc/acc2_pearl.png');
  earringImages[2] = loadImage('pic/acc/acc3_tassel.png');
  earringImages[3] = loadImage('pic/acc/acc4_jade.png');
  earringImages[4] = loadImage('pic/acc/acc5_phoenix.png');
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  capture = createCapture(VIDEO);
  capture.size(640, 480); // 設定擷取解析度以維持辨識效能
  // 隱藏預設的 HTML 影片元件，只在畫布上繪製
  capture.hide();

  // 初始化 ml5.bodyPose (使用最新 v1 API)
  bodyPose = ml5.bodyPose(capture, modelReady);
  
  // 初始化 ml5.handPose 進行手勢辨識
  handPose = ml5.handPose(capture, () => console.log('HandPose Loaded!'));
  handPose.detectStart(capture, gotHands);
}

function modelReady() {
  console.log('Model Loaded!');
  // 確保模型載入後才開始偵測
  bodyPose.detectStart(capture, gotPoses);
}

function gotHands(results) {
  hands = results;
}

function gotPoses(results) {
  poses = results;
}

function draw() {
  // 設定背景顏色
  background('#e7c6ff');

  // 繪製置中文字 (位於影像上方，不隨影像鏡像)
  textAlign(CENTER, TOP);
  textSize(24);
  fill(0); // 設定文字顏色為黑色
  text("414730795林瑜萱", width / 2, 30);
  text("作品為影像辨識_耳環臉譜", width / 2, 70); // 確保文字內容正確

  // 在畫面上方顯示目前偵測到的手勢編號（除錯用）
  fill(255, 0, 0);
  textSize(20);
  noStroke();
  text("目前手勢款式: " + (currentEarringIndex + 1), width / 2, 110);

  // 檢查攝影機是否正常載入
  if (capture && capture.width <= 1 && frameCount > 100) {
    fill(255, 0, 0);
    textSize(20);
    textAlign(CENTER, CENTER);
    text("❌ 錯誤：找不到攝影機裝置", width / 2, height / 2);
    text("請確認攝影機已連接，且正透過伺服器環境 (如 Live Server) 執行。", width / 2, height / 2 + 40);
    return; // 停止繪製，避免後續計算錯誤
  }

  // 如果模型還在載入中，顯示提示
  if (!capture.loadedmetadata || (poses.length === 0 && hands.length === 0)) {
    fill(100);
    textSize(16);
    textAlign(CENTER, TOP);
    text("正在偵測中，請確保臉部與手部位於畫面中...", width / 2, height - 30);
  }

  // 更新目前應顯示的耳環索引（基於手指數量）
  updateEarringSelection();

  let vWidth = width * 0.5;
  let vHeight = height * 0.5;

  push();
  // 將原點移動到畫布中心
  translate(width / 2, height / 2);
  // 左右顛倒處理 (鏡像)
  scale(-1, 1);
  // 繪製影像，影像中心對準當前原點 (0,0)
  imageMode(CENTER);
  image(capture, 0, 0, vWidth, vHeight);

  // 繪製耳垂裝飾（耳環）
  drawEarrings(vWidth, vHeight);
  
  pop();
}

function updateEarringSelection() {
  if (hands.length > 0) {
    let hand = hands[0];
    let count = 0;

    // 改良的手指判定：指尖必須明顯高於第二指節，且加入信心值基本檢查
    // 食指到小指
    if (hand.index_finger_tip && hand.index_finger_tip.y < hand.index_finger_pip.y - 10) count++;
    if (hand.middle_finger_tip && hand.middle_finger_tip.y < hand.middle_finger_pip.y - 10) count++;
    if (hand.ring_finger_tip && hand.ring_finger_tip.y < hand.ring_finger_pip.y - 10) count++;
    if (hand.pinky_finger_tip && hand.pinky_finger_tip.y < hand.pinky_finger_pip.y - 10) count++;
    
    // 拇指 (判斷指尖與指節的水平距離是否拉開)
    if (hand.thumb_tip && hand.index_finger_mcp) {
      let thumbDist = dist(hand.thumb_tip.x, hand.thumb_tip.y, hand.index_finger_mcp.x, hand.index_finger_mcp.y);
      let palmSize = dist(hand.wrist.x, hand.wrist.y, hand.middle_finger_mcp.x, hand.middle_finger_mcp.y);
      if (thumbDist > palmSize * 0.8) count++;
    }

    // 當手指數量在 1~5 之間時，更新索引
    if (count >= 1 && count <= 5) {
      currentEarringIndex = count - 1;
    }
  }
}

function drawEarrings(vWidth, vHeight) {
  // 確保索引不越界
  let img = earringImages[currentEarringIndex];

  // 遍歷所有偵測到的人臉/身體
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];

    // 取得左右耳座標 (ml5 v1 版使用底線命名)
    const parts = ['right_ear', 'left_ear']; // 順序調整，但在鏡像下兩者皆會處理
    
    parts.forEach(part => {
      let ear = pose[part];
      
      // 只在信心值足夠時才繪製（將門檻稍微調低至 0.1 確保容易看到效果）
      if (ear && ear.confidence > 0.1) {
        // 獲取攝影機實際寬高，若尚未載入則預設為 640x480
        let cw = capture.width > 0 ? capture.width : 640;
        let ch = capture.height > 0 ? capture.height : 480;

        // 將偵測點映射到畫布中央顯示區域的相對座標 (-vWidth/2 到 vWidth/2)
        let mappedX = map(ear.x, 0, cw, -vWidth / 2, vWidth / 2);
        let mappedY = map(ear.y, 0, ch, -vHeight / 2, vHeight / 2);

        // 定義耳環比例與移動
        let imgSize = vWidth * 0.12; // 稍微放大一點點
        
        // 往上移動：減少 Y 值 (以圖片大小的 15% 為比例)
        let finalY = mappedY - (imgSize * 0.15); 
        
        // 往外移動：在鏡像座標系下，右耳(畫面左側)往右外移是減，左耳(畫面右側)往左外移是加
        let offsetX = (part === 'right_ear' ? -1 : 1) * (imgSize * 0.1);
        let finalX = mappedX + offsetX;

        push();
        imageMode(CENTER);
        // 顯示目前選擇的耳環圖片
        image(img, finalX, finalY, imgSize, imgSize);
        pop();
      }
    });
  }
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}