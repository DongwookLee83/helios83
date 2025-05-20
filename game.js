// 게임 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const livesContainer = document.getElementById('lives');
const pauseButton = document.getElementById('pauseButton');
const closeButton = document.getElementById('closeButton');
const levelSelect = document.getElementById('levelSelect');
const easyButton = document.getElementById('easyButton');
const normalButton = document.getElementById('normalButton');
const hardButton = document.getElementById('hardButton');
const levelUpMessage = document.getElementById('levelUpMessage');
const failMessage = document.getElementById('failMessage');
const versionSelect = document.getElementById('versionSelect');
const pcButton = document.getElementById('pcButton');
const mobileButton = document.getElementById('mobileButton');
const shareButton = document.getElementById('shareButton');

// 게임 상태
let gameStarted = false;
let gamePaused = false;
let score = 0;
let level = 'Easy';
let lives = 3;
let isLevelingUp = false;
let isFailing = false;
let isMobileVersion = false;

// 무지개 색상 배열
const rainbowColors = [
    '#FF0000', // 빨강
    '#FF7F00', // 주황
    '#FFFF00', // 노랑
    '#00FF00', // 초록
    '#0000FF', // 파랑
    '#4B0082', // 남색
    '#9400D3'  // 보라
];

// 패들 설정
const paddle = {
    width: 100,
    height: 20,
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    speed: 8,
    dx: 0
};

// 공 설정
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 8,
    speed: 4,
    dx: 4,
    dy: -4
};

// 벽돌 설정
const brickRowCount = 7;
const brickColumnCount = 9;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 60;
const brickOffsetLeft = 35;

// 벽돌 배열 초기화
let bricks = [];

// 사운드 효과
const sounds = {
    hit: new Audio('https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3'),
    paddle: new Audio('https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3'),
    levelUp: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
    gameOver: new Audio('https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3')
};

// 사운드 초기화
function initSounds() {
    Object.values(sounds).forEach(sound => {
        sound.volume = 0.2;
        sound.load();
    });
}

// 생명 표시 업데이트
function updateLivesDisplay() {
    livesContainer.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const heart = document.createElement('span');
        heart.className = 'heart';
        heart.innerHTML = '❤️';
        livesContainer.appendChild(heart);
    }
}

// 벽돌 초기화 함수
function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { 
                x: 0, 
                y: 0, 
                status: 1,
                color: rainbowColors[r]
            };
        }
    }
}

// 레벨에 따른 게임 설정
function setLevelSettings() {
    switch(level) {
        case 'Easy':
            ball.speed = 4;
            paddle.width = 100;
            break;
        case 'Normal':
            ball.speed = 6;
            paddle.width = 80;
            break;
        case 'Hard':
            ball.speed = 8;
            paddle.width = 60;
            break;
    }
    ball.dx = ball.speed;
    ball.dy = -ball.speed;
}

// 레벨업 메시지 표시
function showLevelUpMessage() {
    isLevelingUp = true;
    levelUpMessage.style.display = 'block';
    playSound(sounds.levelUp);
    
    setTimeout(() => {
        levelUpMessage.style.display = 'none';
        isLevelingUp = false;
        gameLoop();
    }, 1000);
}

// 레벨 선택 표시
function showLevelSelect() {
    startButton.style.display = 'none';
    levelSelect.style.display = 'block';
}

// 레벨 선택 처리
function selectLevel(selectedLevel) {
    level = selectedLevel;
    levelElement.textContent = level;
    levelSelect.style.display = 'none';
    startGame();
}

// 버전 선택 표시
function showVersionSelect() {
    startButton.style.display = 'none';
    versionSelect.style.display = 'block';
}

// 버전 선택 처리
function selectVersion(isMobile) {
    isMobileVersion = isMobile;
    versionSelect.style.display = 'none';
    showLevelSelect();
    
    if (isMobile) {
        // 모바일 버전에서는 캔버스 크기 조정
        canvas.width = Math.min(800, window.innerWidth - 20);
        canvas.height = canvas.width * 0.75;
        
        // 패들 위치 재조정
        paddle.y = canvas.height - 30;
        resetBall();
    }
}

// 게임 시작
function startGame() {
    gameStarted = true;
    gamePaused = false;
    initBricks();
    setLevelSettings();
    updateLivesDisplay();
    gameLoop();
}

// 게임 일시정지
function togglePause() {
    if (!gameStarted || isLevelingUp || isFailing) return;
    
    gamePaused = !gamePaused;
    pauseButton.textContent = gamePaused ? '계속하기' : '일시정지';
    
    if (!gamePaused) {
        gameLoop();
    }
}

// 게임 종료
function closeGame() {
    if (confirm('게임을 종료하시겠습니까?')) {
        gameStarted = false;
        gamePaused = false;
        resetGame();
        startButton.style.display = 'block';
        pauseButton.textContent = '일시정지';
    }
}

// 패들 그리기
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
}

// 공 그리기
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
}

// 벽돌 그리기
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = bricks[c][r].color;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// 효과음 재생
function playSound(sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.log('Sound play failed:', e));
}

// 충돌 감지
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    scoreElement.textContent = score;
                    playSound(sounds.hit);

                    // 레벨 업 체크
                    if (score >= 100 && level === 'Easy') {
                        level = 'Normal';
                        levelElement.textContent = level;
                        setLevelSettings();
                        initBricks();
                        showLevelUpMessage();
                        return;
                    } else if (score >= 200 && level === 'Normal') {
                        level = 'Hard';
                        levelElement.textContent = level;
                        setLevelSettings();
                        initBricks();
                        showLevelUpMessage();
                        return;
                    }
                }
            }
        }
    }
}

// Fail 메시지 표시
function showFailMessage() {
    isFailing = true;
    failMessage.style.display = 'block';
    
    setTimeout(() => {
        failMessage.style.display = 'none';
        isFailing = false;
        gameLoop();
    }, 1000);
}

// 게임 오버 체크
function checkGameOver() {
    if (ball.y + ball.dy > canvas.height - ball.radius) {
        lives--;
        updateLivesDisplay();
        if (lives === 0) {
            gameStarted = false;
            playSound(sounds.gameOver);
            alert('게임 오버!');
            startButton.style.display = 'block';
            resetGame();
        } else {
            showFailMessage();
            resetBall();
        }
    }
}

// 공 위치 초기화
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;
    ball.dx = ball.speed;
    ball.dy = -ball.speed;
}

// 게임 초기화
function resetGame() {
    score = 0;
    level = 'Easy';
    lives = 3;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    updateLivesDisplay();
    resetBall();
    initBricks();
}

// 게임 루프
function gameLoop() {
    if (!gameStarted || gamePaused || isLevelingUp || isFailing) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();
    checkGameOver();

    // 벽 충돌
    if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
    }
    if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
    }

    // 패들 충돌
    if (ball.y + ball.dy > paddle.y - ball.radius &&
        ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
        ball.dy = -ball.dy;
        playSound(sounds.paddle);
    }

    // 패들 이동
    if (paddle.x + paddle.dx > 0 && paddle.x + paddle.dx + paddle.width < canvas.width) {
        paddle.x += paddle.dx;
    }

    // 공 이동
    ball.x += ball.dx;
    ball.y += ball.dy;

    requestAnimationFrame(gameLoop);
}

// 키보드 이벤트
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        paddle.dx = paddle.speed;
    } else if (e.key === 'ArrowLeft') {
        paddle.dx = -paddle.speed;
    } else if (e.key === 'p' || e.key === 'P') {
        togglePause();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        paddle.dx = 0;
    }
});

// 게임 시작 버튼 이벤트
startButton.addEventListener('click', () => {
    initSounds();
    showVersionSelect();
});

// 레벨 선택 버튼 이벤트
easyButton.addEventListener('click', () => selectLevel('Easy'));
normalButton.addEventListener('click', () => selectLevel('Normal'));
hardButton.addEventListener('click', () => selectLevel('Hard'));

// 일시정지 버튼 이벤트
pauseButton.addEventListener('click', togglePause);

// 게임 종료 버튼 이벤트
closeButton.addEventListener('click', closeGame);

// 버전 선택 버튼 이벤트
pcButton.addEventListener('click', () => selectVersion(false));
mobileButton.addEventListener('click', () => selectVersion(true));

// 공유 버튼 이벤트
shareButton.addEventListener('click', shareGame);

// 터치 이벤트 리스너
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

// 터치 이벤트 처리
function handleTouchMove(e) {
    if (!isMobileVersion || !gameStarted || gamePaused) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    
    // 패들 위치 업데이트
    paddle.x = touchX - paddle.width / 2;
    
    // 패들이 캔버스 경계를 벗어나지 않도록 제한
    if (paddle.x < 0) {
        paddle.x = 0;
    } else if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

// 게임 공유
function shareGame() {
    if (navigator.share) {
        navigator.share({
            title: 'Arkanoid Game',
            text: '내가 만든 아케이드 게임을 플레이해보세요!',
            url: window.location.href
        })
        .catch(error => console.log('공유 실패:', error));
    } else {
        // 공유 API를 지원하지 않는 경우 클립보드에 복사
        const dummy = document.createElement('input');
        document.body.appendChild(dummy);
        dummy.value = window.location.href;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
        alert('게임 URL이 클립보드에 복사되었습니다!');
    }
} 